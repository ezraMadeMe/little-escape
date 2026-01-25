package com.littleescape.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.littleescape.api.domain.Library;
import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.PopularBook;
import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.dto.ingestion.*;
import com.littleescape.api.repository.LibraryRepository;
import com.littleescape.api.repository.PlaceRepository;
import com.littleescape.api.repository.PopularBookRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * 통합 공공 데이터 수집 서비스
 *
 * 다양한 공공 API에서 데이터를 수집하여 DB에 저장
 * 2030 1인 가구 타겟에 맞는 엄격한 필터링 적용
 *
 * 수집 소스:
 * 1. KOPIS - 공연/전시/축제 정보
 * 2. Seoul Open Data - 문화행사, 공원, 공공서비스예약
 * 3. Data4Library - 도서관, 인기대출도서
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataCollectionService {

    private final PlaceRepository placeRepository;
    private final LibraryRepository libraryRepository;
    private final PopularBookRepository popularBookRepository;
    private final ContentFilteringService filteringService;

    private final WebClient kopisWebClient;
    private final WebClient seoulWebClient;
    private final WebClient libraryWebClient;
    private final WebClient kakaoWebClient;

    @PersistenceContext
    private EntityManager entityManager;

    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private final XmlMapper xmlMapper = new XmlMapper();

    @Value("${external-api.kopis.service-key}")
    private String kopisApiKey;

    @Value("${external-api.seoul.service-key}")
    private String seoulApiKey;

    @Value("${external-api.library.auth-key}")
    private String libraryAuthKey;

    @Value("${external-api.kakao.rest-api-key}")
    private String kakaoApiKey;

    @Value("${data-ingestion.enabled:true}")
    private boolean ingestionEnabled;

    // ========== 전체 수집 (스케줄러용) ==========

    /**
     * 전체 데이터 수집 실행
     * 스케줄러 또는 수동 트리거로 호출
     */
    @Transactional
    public CollectionSummary collectAll() {
        if (!ingestionEnabled) {
            log.info("⏸️ 데이터 수집이 비활성화되어 있습니다.");
            return new CollectionSummary();
        }

        log.info("========================================");
        log.info("🚀 통합 공공 데이터 수집 시작");
        log.info("실행 시각: {}", LocalDateTime.now());
        log.info("========================================");

        CollectionSummary summary = new CollectionSummary();

        try {
            // 1. KOPIS - 공연/전시/축제
            log.info("📚 [1/6] KOPIS 공연 데이터 수집...");
            CollectionResult kopisResult = collectPerformances();
            summary.addResult("KOPIS_PERFORMANCE", kopisResult);

            log.info("🎪 [2/6] KOPIS 축제 데이터 수집...");
            CollectionResult festivalResult = collectFestivals();
            summary.addResult("KOPIS_FESTIVAL", festivalResult);

            // 2. 서울시 - 문화행사, 공원, 공공예약
            log.info("🎭 [3/6] 서울시 문화행사 데이터 수집...");
            CollectionResult seoulEventResult = collectSeoulCulturalEvents();
            summary.addResult("SEOUL_CULTURE", seoulEventResult);

            log.info("🌳 [4/6] 서울시 공원 데이터 수집...");
            CollectionResult parkResult = collectSeoulParks();
            summary.addResult("SEOUL_PARK", parkResult);

            // 3. 서울시 - 모범음식점
            log.info("🍽️ [5/6] 서울시 모범음식점 데이터 수집...");
            CollectionResult restaurantResult = collectSeoulRestaurants();
            summary.addResult("SEOUL_RESTAURANT", restaurantResult);

            // 4. 도서관정보나루 - 도서관, 인기도서
            log.info("📖 [6/6] 도서관 데이터 수집...");
            CollectionResult libraryResult = collectLibraries();
            summary.addResult("LIBRARY", libraryResult);

            log.info("========================================");
            log.info("🎉 전체 데이터 수집 완료");
            log.info("📊 {}", summary);
            log.info("========================================");

        } catch (Exception e) {
            log.error("❌ 데이터 수집 중 오류 발생", e);
        }

        return summary;
    }

    // ========== KOPIS API 수집 ==========

    /**
     * KOPIS - 공연/전시 정보 수집 (필터링 적용)
     */
    @Transactional
    public CollectionResult collectPerformances() {
        CollectionResult result = new CollectionResult();

        try {
            String startDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String endDate = LocalDate.now().plusMonths(3).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            // 공연 목록 조회
            String response = kopisWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/pblprfr")
                            .queryParam("service", kopisApiKey)
                            .queryParam("stdate", startDate)
                            .queryParam("eddate", endDate)
                            .queryParam("signgucode", "11")  // 서울
                            .queryParam("cpage", 1)
                            .queryParam("rows", 100)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                KopisResponse kopisResponse = xmlMapper.readValue(response, KopisResponse.class);

                if (kopisResponse.getPerformances() != null) {
                    log.info("KOPIS 공연 데이터 {}건 수신", kopisResponse.getPerformances().size());

                    for (KopisResponse.Performance perf : kopisResponse.getPerformances()) {
                        processPerformance(perf, result);
                        Thread.sleep(100);  // Rate limit
                    }
                }
            }

        } catch (Exception e) {
            log.error("KOPIS 공연 데이터 수집 실패", e);
        }

        log.info("✅ KOPIS 공연 수집 완료 - 신규: {}, 갱신: {}, 필터링: {}, 스킵: {}",
                result.inserted, result.updated, result.filtered, result.skipped);
        return result;
    }

    /**
     * 개별 공연 처리 (상세 API 호출 + 필터링)
     */
    private void processPerformance(KopisResponse.Performance perf, CollectionResult result) {
        try {
            // 1차 필터링: 제목 기반
            if (filteringService.shouldExclude(perf.getName(), null)) {
                result.filtered++;
                log.debug("필터링 (제목): {}", perf.getName());
                return;
            }

            // 상세 정보 조회
            PerformanceDetailResponse detail = fetchPerformanceDetail(perf.getId());

            if (detail != null && detail.getDetail() != null) {
                PerformanceDetailResponse.PerformanceDetail detailInfo = detail.getDetail();

                // 2차 필터링: 상세 내용 + 가격
                if (filteringService.shouldExcludeComprehensive(
                        detailInfo.getName(),
                        detailInfo.getFacilityName(),
                        detailInfo.getSynopsis(),
                        detailInfo.getPriceInfo())) {
                    result.filtered++;
                    log.debug("필터링 (상세): {}", detailInfo.getName());
                    return;
                }

                // 가격 파싱
                Integer ticketPrice = filteringService.parseMinPrice(detailInfo.getPriceInfo());
                Boolean isFree = filteringService.isFree(detailInfo.getPriceInfo());

                // 날짜 파싱
                LocalDate startDate = parseDate(detailInfo.getStartDate());
                LocalDate endDate = parseDate(detailInfo.getEndDate());

                // externalId 기준 upsert
                Optional<Place> existing = placeRepository.findByExternalId(perf.getId());

                if (existing.isPresent()) {
                    // 업데이트
                    Place place = existing.get();
                    place.updatePerformanceInfo(
                            detailInfo.getState(),
                            ticketPrice,
                            startDate,
                            endDate,
                            detailInfo.getPosterUrl()
                    );
                    placeRepository.save(place);
                    result.updated++;
                } else {
                    // 신규 생성
                    GeoLocation geo = getCoordinatesFromFacilityName(perf.getFacilityName());

                    Place place = Place.builder()
                            .name(detailInfo.getName())
                            .address(detailInfo.getFacilityName() + " (서울)")
                            .url(null)
                            .latitude(geo.latitude)
                            .longitude(geo.longitude)
                            .category(determinePerformanceCategory(detailInfo.getGenre()))
                            .imageUrl(detailInfo.getPosterUrl())
                            .dataSource(DataSource.KOPIS)
                            .externalId(perf.getId())
                            .startDate(startDate)
                            .endDate(endDate)
                            .ticketPrice(ticketPrice)
                            .isFree(isFree)
                            .performanceState(detailInfo.getState())
                            .build();

                    placeRepository.save(place);
                    result.inserted++;
                }
            }

        } catch (Exception e) {
            log.warn("공연 처리 실패: {}", perf.getName(), e);
            result.skipped++;
            if (entityManager != null) entityManager.clear();
        }
    }

    /**
     * KOPIS 공연 상세 API 호출
     */
    private PerformanceDetailResponse fetchPerformanceDetail(String performanceId) {
        try {
            String response = kopisWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/pblprfr/{id}")
                            .queryParam("service", kopisApiKey)
                            .build(performanceId))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                return xmlMapper.readValue(response, PerformanceDetailResponse.class);
            }
        } catch (Exception e) {
            log.warn("공연 상세 조회 실패: {}", performanceId, e);
        }
        return null;
    }

    /**
     * KOPIS - 축제 정보 수집 (필터링 적용)
     */
    @Transactional
    public CollectionResult collectFestivals() {
        CollectionResult result = new CollectionResult();

        try {
            String startDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String endDate = LocalDate.now().plusMonths(3).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            String response = kopisWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/prffest")
                            .queryParam("service", kopisApiKey)
                            .queryParam("stdate", startDate)
                            .queryParam("eddate", endDate)
                            .queryParam("signgucode", "11")  // 서울
                            .queryParam("cpage", 1)
                            .queryParam("rows", 50)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                FestivalResponse festivalResponse = xmlMapper.readValue(response, FestivalResponse.class);

                if (festivalResponse.getFestivals() != null) {
                    log.info("KOPIS 축제 데이터 {}건 수신", festivalResponse.getCount());

                    for (FestivalResponse.Festival fest : festivalResponse.getFestivals()) {
                        processFestival(fest, result);
                        Thread.sleep(100);
                    }
                }
            }

        } catch (Exception e) {
            log.error("KOPIS 축제 데이터 수집 실패", e);
        }

        log.info("✅ KOPIS 축제 수집 완료 - 신규: {}, 갱신: {}, 필터링: {}, 스킵: {}",
                result.inserted, result.updated, result.filtered, result.skipped);
        return result;
    }

    /**
     * 개별 축제 처리
     */
    private void processFestival(FestivalResponse.Festival fest, CollectionResult result) {
        try {
            // 필터링
            if (filteringService.shouldExclude(fest.getName(), null)) {
                result.filtered++;
                return;
            }

            LocalDate startDate = parseDate(fest.getStartDate());
            LocalDate endDate = parseDate(fest.getEndDate());

            Optional<Place> existing = placeRepository.findByExternalId(fest.getId());

            if (existing.isPresent()) {
                Place place = existing.get();
                place.updatePerformanceInfo(fest.getState(), null, startDate, endDate, fest.getPosterUrl());
                placeRepository.save(place);
                result.updated++;
            } else {
                GeoLocation geo = getCoordinatesFromFacilityName(fest.getFacilityName());

                Place place = Place.builder()
                        .name(fest.getName())
                        .address(fest.getFacilityName() + " (" + fest.getArea() + ")")
                        .latitude(geo.latitude)
                        .longitude(geo.longitude)
                        .category(MissionCategory.ACTIVITY)  // 축제는 ACTIVITY
                        .imageUrl(fest.getPosterUrl())
                        .dataSource(DataSource.KOPIS)
                        .externalId(fest.getId())
                        .startDate(startDate)
                        .endDate(endDate)
                        .performanceState(fest.getState())
                        .build();

                placeRepository.save(place);
                result.inserted++;
            }

        } catch (Exception e) {
            log.warn("축제 처리 실패: {}", fest.getName(), e);
            result.skipped++;
            if (entityManager != null) {
                entityManager.clear();
            }
        }
    }

    // ========== 서울시 API 수집 ==========

    /**
     * 서울시 - 문화행사 정보 수집
     */
    @Transactional
    public CollectionResult collectSeoulCulturalEvents() {
        CollectionResult result = new CollectionResult();

        try {
            String response = seoulWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(seoulApiKey, "json", "culturalEventInfo", "1", "100")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                SeoulEventResponse seoulResponse = objectMapper.readValue(response, SeoulEventResponse.class);

                if (seoulResponse.getCulturalEventInfo() != null
                        && seoulResponse.getCulturalEventInfo().getEvents() != null) {

                    List<SeoulEventResponse.Event> events = seoulResponse.getCulturalEventInfo().getEvents();
                    log.info("서울시 문화행사 데이터 {}건 수신", events.size());

                    for (SeoulEventResponse.Event event : events) {
                        processSeoulEvent(event, result);
                    }
                }
            }

        } catch (Exception e) {
            log.error("서울시 문화행사 수집 실패", e);
        }

        log.info("✅ 서울시 문화행사 수집 완료 - 신규: {}, 갱신: {}, 필터링: {}, 스킵: {}",
                result.inserted, result.updated, result.filtered, result.skipped);
        return result;
    }

    /**
     * 개별 서울시 문화행사 처리
     */
    private void processSeoulEvent(SeoulEventResponse.Event event, CollectionResult result) {
        try {
            // 필터링
            if (filteringService.shouldExclude(event.getTitle(), null)) {
                result.filtered++;
                return;
            }

            if (event.getPlace() == null || event.getPlace().isEmpty()) {
                result.skipped++;
                return;
            }

            // externalId 생성 (서울시 API에는 고유 ID가 없으므로 제목+장소 해시 사용)
            String externalId = "SEOUL_" + Math.abs((event.getTitle() + event.getPlace()).hashCode());

            Optional<Place> existing = placeRepository.findByExternalId(externalId);

            Double latitude = parseDouble(event.getLatitude());
            Double longitude = parseDouble(event.getLongitude());

            if (latitude == null || longitude == null) {
                GeoLocation geo = getCoordinatesFromAddress(event.getPlace());
                latitude = geo.latitude;
                longitude = geo.longitude;
            }

            MissionCategory category = determineCategoryFromCodeName(event.getCodeName());
            Boolean isFree = event.getIsFree() != null && "무료".equals(event.getIsFree());

            if (existing.isPresent()) {
                result.skipped++;  // 서울시 이벤트는 업데이트 로직 단순화
            } else {
                Place place = Place.builder()
                        .name(event.getTitle())
                        .address(event.getPlace())
                        .url(event.getOrgLink() != null ? event.getOrgLink() : event.getHomepageAddr())
                        .latitude(latitude)
                        .longitude(longitude)
                        .category(category)
                        .imageUrl(event.getMainImg())
                        .dataSource(DataSource.SEOUL_CULTURE)
                        .externalId(externalId)
                        .isFree(isFree)
                        .build();

                placeRepository.save(place);
                result.inserted++;
            }

        } catch (Exception e) {
            log.warn("서울시 행사 처리 실패: {}", event.getTitle(), e);
            result.skipped++;
            if (entityManager != null) {
                entityManager.clear();
            }
        }
    }

    /**
     * 서울시 - 공원 현황 수집
     */
    @Transactional
    public CollectionResult collectSeoulParks() {
        CollectionResult result = new CollectionResult();

        try {
            String response = seoulWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(seoulApiKey, "json", "SearchParkInfoService", "1", "200")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                SeoulParkResponse parkResponse = objectMapper.readValue(response, SeoulParkResponse.class);

                if (!parkResponse.isEmpty()) {
                    log.info("서울시 공원 데이터 {}건 수신", parkResponse.getCount());

                    for (SeoulParkResponse.Park park : parkResponse.getParks()) {
                        processPark(park, result);
                    }
                }
            }

        } catch (Exception e) {
            log.error("서울시 공원 수집 실패", e);
        }

        log.info("✅ 서울시 공원 수집 완료 - 신규: {}, 갱신: {}, 필터링: {}, 스킵: {}",
                result.inserted, result.updated, result.filtered, result.skipped);
        return result;
    }

    /**
     * 개별 공원 처리
     */
    private void processPark(SeoulParkResponse.Park park, CollectionResult result) {
        try {
            // 어린이공원, 소공원 등 필터링
            if (filteringService.shouldExclude(park.getParkName(), null)) {
                result.filtered++;
                return;
            }

            String externalId = "PARK_" + park.getParkName().hashCode();
            Optional<Place> existing = placeRepository.findByExternalId(externalId);

            if (existing.isPresent()) {
                result.skipped++;
                return;
            }

            Double latitude = parseDouble(park.getLatitude());
            Double longitude = parseDouble(park.getLongitude());

            if (latitude == null || longitude == null) {
                GeoLocation geo = getCoordinatesFromAddress(park.getAddress());
                latitude = geo.latitude;
                longitude = geo.longitude;
            }

            Place place = Place.builder()
                    .name(park.getParkName())
                    .address(park.getAddress())
                    .latitude(latitude)
                    .longitude(longitude)
                    .category(MissionCategory.RELAX)  // 공원은 RELAX
                    .dataSource(DataSource.SEOUL_PARK)
                    .externalId(externalId)
                    .isFree(true)  // 공원은 무료
                    .build();

            placeRepository.save(place);
            result.inserted++;

        } catch (Exception e) {
            log.warn("공원 처리 실패: {}", park.getParkName(), e);
            result.skipped++;
            if (entityManager != null) {
                entityManager.clear();
            }
        }
    }

    /**
     * 서울시 - 공공서비스예약 문화행사 수집
     */
    @Transactional
    public CollectionResult collectPublicReservationCulture() {
        CollectionResult result = new CollectionResult();

        try {
            String response = seoulWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(seoulApiKey, "json", "ListPublicReservationCulture", "1", "100")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                PublicReservationCultureResponse reservationResponse =
                        objectMapper.readValue(response, PublicReservationCultureResponse.class);

                if (reservationResponse.isSuccess() && !reservationResponse.isEmpty()) {
                    log.info("서울시 공공예약 문화행사 {}건 수신", reservationResponse.getCount());

                    for (PublicReservationCultureResponse.CultureEvent event : reservationResponse.getEvents()) {
                        processPublicReservationEvent(event, result);
                    }
                }
            }

        } catch (Exception e) {
            log.error("서울시 공공예약 수집 실패", e);
        }

        log.info("✅ 서울시 공공예약 수집 완료 - 신규: {}, 갱신: {}, 필터링: {}, 스킵: {}",
                result.inserted, result.updated, result.filtered, result.skipped);
        return result;
    }

    /**
     * 개별 공공예약 문화행사 처리
     */
    private void processPublicReservationEvent(PublicReservationCultureResponse.CultureEvent event,
                                               CollectionResult result) {
        try {
            // 필터링
            if (filteringService.shouldExclude(event.getServiceName(), event.getDetailContent())) {
                result.filtered++;
                return;
            }

            // 이용대상 필터링
            if (event.getTargetInfo() != null &&
                (event.getTargetInfo().contains("아동") ||
                 event.getTargetInfo().contains("초등") ||
                 event.getTargetInfo().contains("유아"))) {
                result.filtered++;
                return;
            }

            String externalId = event.getServiceId();
            Optional<Place> existing = placeRepository.findByExternalId(externalId);

            if (existing.isPresent()) {
                result.skipped++;
                return;
            }

            Double latitude = parseDouble(event.getLatitude());
            Double longitude = parseDouble(event.getLongitude());

            if (latitude == null || longitude == null) {
                GeoLocation geo = getCoordinatesFromAddress(event.getPlaceName());
                latitude = geo.latitude;
                longitude = geo.longitude;
            }

            Boolean isFree = "무료".equals(event.getPayType());
            MissionCategory category = determineCategoryFromClassName(event.getMaxClassName());

            Place place = Place.builder()
                    .name(event.getServiceName())
                    .address(event.getPlaceName() + " (" + event.getAreaName() + ")")
                    .url(event.getServiceUrl())
                    .latitude(latitude)
                    .longitude(longitude)
                    .category(category)
                    .imageUrl(event.getImageUrl())
                    .dataSource(DataSource.SEOUL_RESERVATION)
                    .externalId(externalId)
                    .isFree(isFree)
                    .build();

            placeRepository.save(place);
            result.inserted++;

        } catch (Exception e) {
            log.warn("공공예약 행사 처리 실패: {}", event.getServiceName(), e);
            result.skipped++;
            if (entityManager != null) {
                entityManager.clear();
            }
        }
    }

    /**
     * 서울시 - 모범음식점 수집 (기존 로직 유지)
     */
    @Transactional
    public CollectionResult collectSeoulRestaurants() {
        CollectionResult result = new CollectionResult();

        try {
            String response = seoulWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(seoulApiKey, "json", "LOCALDATA_072405", "1", "1000")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                SeoulRestaurantResponse restaurantResponse = objectMapper.readValue(response, SeoulRestaurantResponse.class);

                if (restaurantResponse != null
                        && restaurantResponse.getRestaurantData() != null
                        && restaurantResponse.getRestaurantData().getRestaurants() != null) {

                    List<SeoulRestaurantResponse.Restaurant> restaurants =
                            restaurantResponse.getRestaurantData().getRestaurants();
                    log.info("서울시 모범음식점 데이터 {}건 수신", restaurants.size());

                    for (SeoulRestaurantResponse.Restaurant restaurant : restaurants) {
                        processRestaurant(restaurant, result);
                    }
                }
            }

        } catch (Exception e) {
            log.error("모범음식점 데이터 수집 실패", e);
        }

        log.info("✅ 모범음식점 수집 완료 - 신규: {}, 갱신: {}, 필터링: {}, 스킵: {}",
                result.inserted, result.updated, result.filtered, result.skipped);
        return result;
    }

    /**
     * 개별 음식점 처리
     */
    private void processRestaurant(SeoulRestaurantResponse.Restaurant restaurant, CollectionResult result) {
        try {
            // 영업 중인 업소만
            if (restaurant.getDetailStatusName() != null
                    && !restaurant.getDetailStatusName().contains("영업")) {
                result.skipped++;
                return;
            }

            if (restaurant.getBusinessName() == null || restaurant.getBusinessName().isEmpty()) {
                result.skipped++;
                return;
            }

            // externalId 생성
            String externalId = "REST_" + Math.abs((restaurant.getBusinessName() +
                    restaurant.getFullAddress()).hashCode());

            Optional<Place> existing = placeRepository.findByExternalId(externalId);
            if (existing.isPresent()) {
                result.skipped++;
                return;
            }

            Double latitude = parseDouble(restaurant.getRefinedLatitude());
            Double longitude = parseDouble(restaurant.getRefinedLongitude());

            if (latitude == null || longitude == null) {
                latitude = parseDouble(restaurant.getLatitude());
                longitude = parseDouble(restaurant.getLongitude());
            }

            if (latitude == null || longitude == null) {
                String address = restaurant.getRefinedRoadAddress() != null
                        ? restaurant.getRefinedRoadAddress()
                        : restaurant.getFullAddress();
                if (address != null && !address.isEmpty()) {
                    GeoLocation geo = getCoordinatesFromAddress(address);
                    latitude = geo.latitude;
                    longitude = geo.longitude;
                }
            }

            String address = restaurant.getRefinedRoadAddress();
            if (address == null || address.isEmpty()) {
                address = restaurant.getRoadAddress();
            }
            if (address == null || address.isEmpty()) {
                address = restaurant.getFullAddress();
            }

            Place place = Place.builder()
                    .name(restaurant.getBusinessName())
                    .address(address)
                    .latitude(latitude)
                    .longitude(longitude)
                    .category(MissionCategory.FOOD)
                    .dataSource(DataSource.SEOUL_RESTAURANT)
                    .externalId(externalId)
                    .build();

            placeRepository.save(place);
            result.inserted++;

        } catch (Exception e) {
            log.warn("음식점 처리 실패: {}", restaurant.getBusinessName(), e);
            result.skipped++;
            if (entityManager != null) {
                entityManager.clear();
            }
        }
    }

    // ========== 도서관정보나루 API 수집 ==========

    /**
     * 도서관 정보 수집
     */
    @Transactional
    public CollectionResult collectLibraries() {
        CollectionResult result = new CollectionResult();

        try {
            String response = libraryWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/libSrch")
                            .queryParam("authKey", libraryAuthKey)
                            .queryParam("region", "11")  // 서울
                            .queryParam("pageNo", 1)
                            .queryParam("pageSize", 200)
                            .queryParam("format", "xml")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                LibraryResponse libraryResponse = xmlMapper.readValue(response, LibraryResponse.class);

                if (libraryResponse.getLibraries() != null) {
                    log.info("도서관 데이터 {}건 수신", libraryResponse.getLibraries().size());

                    for (LibraryResponse.Library lib : libraryResponse.getLibraries()) {
                        processLibrary(lib, result);
                    }
                }
            }

        } catch (Exception e) {
            log.error("도서관 데이터 수집 실패", e);
        }

        log.info("✅ 도서관 수집 완료 - 신규: {}, 갱신: {}, 필터링: {}, 스킵: {}",
                result.inserted, result.updated, result.filtered, result.skipped);
        return result;
    }

    /**
     * 개별 도서관 처리 (Library 엔티티 + Place 엔티티 동시 저장)
     */
    private void processLibrary(LibraryResponse.Library lib, CollectionResult result) {
        try {
            // 필수 필드 체크
            if (lib.getName() == null || lib.getName().isEmpty()) {
                result.skipped++;
                return;
            }

            // Library 엔티티 저장/업데이트
            Optional<Library> existingLib = libraryRepository.findByLibraryCode(lib.getCode());

            Double latitude = parseDouble(lib.getLatitude());
            Double longitude = parseDouble(lib.getLongitude());

            if (latitude == null || longitude == null) {
                if (lib.getAddress() != null && !lib.getAddress().isEmpty()) {
                    GeoLocation geo = getCoordinatesFromAddress(lib.getAddress());
                    latitude = geo.latitude;
                    longitude = geo.longitude;
                } else {
                    // 주소도 없으면 기본 좌표 사용 (서울시청)
                    latitude = 37.5665;
                    longitude = 126.9780;
                }
            }

            // 좌표가 여전히 null이면 스킵
            if (latitude == null || longitude == null) {
                log.debug("좌표 변환 실패로 스킵: {}", lib.getName());
                result.skipped++;
                return;
            }

            if (existingLib.isEmpty()) {
                Library library = Library.builder()
                        .libraryCode(lib.getCode())
                        .name(lib.getName())
                        .address(lib.getAddress() != null ? lib.getAddress() : "")
                        .tel(lib.getTel())
                        .homepage(lib.getHomepage())
                        .latitude(latitude)
                        .longitude(longitude)
                        .closedDays(lib.getClosedDays())
                        .operatingTime(lib.getOperatingTime())
                        .build();
                libraryRepository.save(library);
            }

            // Place 엔티티도 저장 (추천용)
            String externalId = "LIB_" + lib.getCode();
            Optional<Place> existingPlace = placeRepository.findByExternalId(externalId);

            if (existingPlace.isPresent()) {
                result.skipped++;
                return;
            }

            // address가 null이면 기본값 설정
            String address = lib.getAddress();
            if (address == null || address.isEmpty()) {
                address = lib.getName();  // 도서관명을 주소로 사용
            }

            Place place = Place.builder()
                    .name(lib.getName())
                    .address(address)
                    .url(lib.getHomepage())
                    .latitude(latitude)
                    .longitude(longitude)
                    .category(MissionCategory.RELAX)
                    .dataSource(DataSource.LIBRARY)
                    .externalId(externalId)
                    .isFree(true)
                    .closedDays(lib.getClosedDays())
                    .operatingTime(lib.getOperatingTime())
                    .build();

            placeRepository.save(place);
            result.inserted++;

        } catch (Exception e) {
            log.warn("도서관 처리 실패: {}", lib.getName(), e);
            result.skipped++;
            // 세션 클리어 - Hibernate AssertionFailure 방지
            if (entityManager != null) {
                entityManager.clear();
            }
        }
    }

    /**
     * 인기 대출 도서 수집 (20-30대, 서울)
     */
    @Transactional
    public CollectionResult collectPopularBooks() {
        CollectionResult result = new CollectionResult();

        try {
            // 이번 주 수집한 데이터가 이미 있으면 스킵
            LocalDate weekStart = LocalDate.now().minusDays(
                    LocalDate.now().getDayOfWeek().getValue() - 1);
            List<PopularBook> thisWeekBooks = popularBookRepository.findThisWeekPopularBooks(weekStart);

            if (!thisWeekBooks.isEmpty()) {
                log.info("이번 주 인기도서 이미 수집됨: {}건", thisWeekBooks.size());
                return result;
            }

            // API 호출 (startDt, endDt를 사용하여 기간 조회)
            String startDate = LocalDate.now().minusMonths(1).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            String endDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

            String response = libraryWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/loanItemSrch")
                            .queryParam("authKey", libraryAuthKey)
                            .queryParam("startDt", startDate)
                            .queryParam("endDt", endDate)
                            .queryParam("region", "11")  // 서울
                            .queryParam("age", "20")      // 20대
                            .queryParam("pageNo", 1)
                            .queryParam("pageSize", 30)
                            .queryParam("format", "xml")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                PopularBookResponse bookResponse = xmlMapper.readValue(response, PopularBookResponse.class);

                if (!bookResponse.isEmpty()) {
                    log.info("인기대출도서 {}건 수신", bookResponse.getCount());

                    for (PopularBookResponse.BookDoc book : bookResponse.getBooks()) {
                        processPopularBook(book, result);
                    }
                }
            }

        } catch (Exception e) {
            log.error("인기대출도서 수집 실패", e);
        }

        log.info("✅ 인기도서 수집 완료 - 신규: {}, 스킵: {}", result.inserted, result.skipped);
        return result;
    }

    /**
     * 개별 인기도서 처리
     */
    private void processPopularBook(PopularBookResponse.BookDoc book, CollectionResult result) {
        try {
            PopularBook popularBook = PopularBook.builder()
                    .isbn(book.getIsbn())
                    .title(book.getBookName())
                    .author(book.getAuthors())
                    .publisher(book.getPublisher())
                    .publicationYear(book.getPublicationYear())
                    .bookImageUrl(book.getBookImageUrl())
                    .classNo(book.getClassNo())
                    .classNm(book.getClassNm())
                    .ranking(book.getRanking())
                    .loanCount(book.getLoanCount())
                    .collectedAt(LocalDate.now())
                    .build();

            popularBookRepository.save(popularBook);
            result.inserted++;

        } catch (Exception e) {
            log.warn("인기도서 처리 실패: {}", book.getBookName(), e);
            result.skipped++;
            if (entityManager != null) {
                entityManager.clear();
            }
        }
    }

    // ========== 종료 공연 처리 ==========

    /**
     * 종료된 공연/행사 비활성화
     */
    @Transactional
    public int deactivateExpiredPerformances() {
        LocalDate today = LocalDate.now();
        List<DataSource> performanceDataSources = List.of(
                DataSource.KOPIS,
                DataSource.SEOUL_CULTURE,
                DataSource.SEOUL_RESERVATION
        );

        int count = placeRepository.deactivateExpiredPerformances(today, performanceDataSources);
        log.info("🔄 종료된 공연/행사 {}건 비활성화", count);
        return count;
    }

    // ========== 유틸리티 메서드 ==========

    /**
     * Kakao Local API - 주소를 좌표로 변환
     */
    private GeoLocation getCoordinatesFromAddress(String address) {
        try {
            String response = kakaoWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v2/local/search/address.json")
                            .queryParam("query", address)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                KakaoGeoResponse geoResponse = objectMapper.readValue(response, KakaoGeoResponse.class);

                if (geoResponse.getDocuments() != null && !geoResponse.getDocuments().isEmpty()) {
                    KakaoGeoResponse.Document doc = geoResponse.getDocuments().get(0);
                    Double longitude = parseDouble(doc.getLongitude());
                    Double latitude = parseDouble(doc.getLatitude());

                    if (latitude != null && longitude != null) {
                        return new GeoLocation(latitude, longitude);
                    }
                }
            }

        } catch (Exception e) {
            log.warn("주소 좌표 변환 실패: {}", address);
        }

        return new GeoLocation(37.5665, 126.9780);  // 기본: 서울시청
    }

    /**
     * 공연장 이름으로 좌표 매핑
     */
    private GeoLocation getCoordinatesFromFacilityName(String facilityName) {
        if (facilityName != null) {
            if (facilityName.contains("예술의전당")) {
                return new GeoLocation(37.4781, 127.0117);
            } else if (facilityName.contains("세종문화회관")) {
                return new GeoLocation(37.5720, 126.9762);
            } else if (facilityName.contains("LG아트센터")) {
                return new GeoLocation(37.5274, 127.0402);
            } else if (facilityName.contains("국립극장")) {
                return new GeoLocation(37.5503, 127.0097);
            } else if (facilityName.contains("대학로")) {
                return new GeoLocation(37.5823, 127.0017);
            }
        }
        return new GeoLocation(37.5665, 126.9780);
    }

    /**
     * 공연 장르에서 카테고리 결정
     */
    private MissionCategory determinePerformanceCategory(String genre) {
        if (genre == null) return MissionCategory.CULTURE;

        if (genre.contains("연극") || genre.contains("뮤지컬") || genre.contains("무용")) {
            return MissionCategory.CULTURE;
        } else if (genre.contains("클래식") || genre.contains("국악") || genre.contains("오페라")) {
            return MissionCategory.CULTURE;
        } else if (genre.contains("대중음악") || genre.contains("콘서트")) {
            return MissionCategory.CULTURE;
        }
        return MissionCategory.CULTURE;
    }

    /**
     * 서울시 문화행사 분류명에서 카테고리 결정
     */
    private MissionCategory determineCategoryFromCodeName(String codeName) {
        if (codeName == null) return MissionCategory.CULTURE;

        if (codeName.contains("공연") || codeName.contains("전시") || codeName.contains("영화")) {
            return MissionCategory.CULTURE;
        } else if (codeName.contains("체험") || codeName.contains("참여") || codeName.contains("축제")) {
            return MissionCategory.ACTIVITY;
        }
        return MissionCategory.CULTURE;
    }

    /**
     * 공공예약 분류명에서 카테고리 결정
     */
    private MissionCategory determineCategoryFromClassName(String className) {
        if (className == null) return MissionCategory.CULTURE;

        if (className.contains("문화") || className.contains("공연") || className.contains("전시")) {
            return MissionCategory.CULTURE;
        } else if (className.contains("체육") || className.contains("스포츠")) {
            return MissionCategory.ACTIVITY;
        } else if (className.contains("교육") || className.contains("강좌")) {
            return MissionCategory.ACTIVITY;
        }
        return MissionCategory.CULTURE;
    }

    /**
     * 문자열 날짜 파싱 (yyyyMMdd 또는 yyyy.MM.dd)
     */
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) return null;

        try {
            String cleaned = dateStr.replace(".", "").replace("-", "");
            if (cleaned.length() >= 8) {
                return LocalDate.parse(cleaned.substring(0, 8),
                        DateTimeFormatter.ofPattern("yyyyMMdd"));
            }
        } catch (Exception e) {
            log.debug("날짜 파싱 실패: {}", dateStr);
        }
        return null;
    }

    /**
     * String을 Double로 안전하게 파싱
     */
    private Double parseDouble(String value) {
        try {
            if (value != null && !value.isEmpty()) {
                return Double.parseDouble(value);
            }
        } catch (NumberFormatException e) {
            log.debug("숫자 변환 실패: {}", value);
        }
        return null;
    }

    // ========== 수동 실행 메서드 ==========

    /**
     * 수동 전체 수집 트리거
     */
    @Transactional
    public CollectionSummary manualTrigger() {
        log.info("🔧 수동 데이터 수집 트리거");
        return collectAll();
    }

    /**
     * 수집 통계 조회
     */
    public CollectionStats getCollectionStats() {
        CollectionStats stats = new CollectionStats();

        stats.totalPlaces = placeRepository.count();
        stats.activePlaces = placeRepository.findByIsActiveTrue().size();
        stats.totalLibraries = libraryRepository.count();
        stats.totalPopularBooks = popularBookRepository.count();

        for (DataSource ds : DataSource.values()) {
            stats.placesBySource.put(ds.name(), placeRepository.countByDataSource(ds));
        }

        for (MissionCategory cat : MissionCategory.values()) {
            stats.placesByCategory.put(cat.name(), placeRepository.countByCategory(cat));
        }

        return stats;
    }

    // ========== 내부 클래스 ==========

    /**
     * 개별 수집 결과
     */
    public static class CollectionResult {
        public int inserted = 0;
        public int updated = 0;
        public int filtered = 0;
        public int skipped = 0;

        @Override
        public String toString() {
            return String.format("신규=%d, 갱신=%d, 필터링=%d, 스킵=%d",
                    inserted, updated, filtered, skipped);
        }
    }

    /**
     * 전체 수집 요약
     */
    public static class CollectionSummary {
        public java.util.Map<String, CollectionResult> results = new java.util.LinkedHashMap<>();
        public int totalInserted = 0;
        public int totalUpdated = 0;
        public int totalFiltered = 0;
        public int totalSkipped = 0;

        public void addResult(String source, CollectionResult result) {
            results.put(source, result);
            totalInserted += result.inserted;
            totalUpdated += result.updated;
            totalFiltered += result.filtered;
            totalSkipped += result.skipped;
        }

        @Override
        public String toString() {
            return String.format("총 신규=%d, 갱신=%d, 필터링=%d, 스킵=%d",
                    totalInserted, totalUpdated, totalFiltered, totalSkipped);
        }
    }

    /**
     * 수집 통계
     */
    public static class CollectionStats {
        public long totalPlaces;
        public long activePlaces;
        public long totalLibraries;
        public long totalPopularBooks;
        public java.util.Map<String, Long> placesBySource = new java.util.LinkedHashMap<>();
        public java.util.Map<String, Long> placesByCategory = new java.util.LinkedHashMap<>();
    }

    /**
     * 좌표 정보
     */
    private static class GeoLocation {
        Double latitude;
        Double longitude;

        GeoLocation(Double latitude, Double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }
    }
}
