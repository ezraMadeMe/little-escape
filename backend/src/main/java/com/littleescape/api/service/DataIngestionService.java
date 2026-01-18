package com.littleescape.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.dto.ingestion.KakaoGeoResponse;
import com.littleescape.api.dto.ingestion.KopisResponse;
import com.littleescape.api.dto.ingestion.LibraryResponse;
import com.littleescape.api.dto.ingestion.SeoulEventResponse;
import com.littleescape.api.dto.ingestion.SeoulRestaurantResponse;
import com.littleescape.api.repository.PlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * 공공 데이터 수집 및 ETL(Extract, Transform, Load) 서비스
 * 
 * 매일 새벽 4시에 실행되어 다음 소스에서 데이터를 수집:
 * 1. KOPIS - 공연/전시 정보
 * 2. Seoul Open Data - 문화행사 정보
 * 3. Data4Library - 도서관 및 도서 정보
 * 
 * 수집된 데이터는 Place 엔티티로 변환되어 DB에 저장됨
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataIngestionService {

    private final PlaceRepository placeRepository;
    private final WebClient kopisWebClient;
    private final WebClient seoulWebClient;
    private final WebClient libraryWebClient;
    private final WebClient kakaoWebClient;
    
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

    /**
     * 스케줄러: 매일 새벽 4시에 전체 데이터 수집 실행
     * cron: 초 분 시 일 월 요일
     */
    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    public void scheduleDataIngestion() {
        if (!ingestionEnabled) {
            log.info("⏸️ 데이터 수집이 비활성화되어 있습니다.");
            return;
        }

        log.info("========================================");
        log.info("🚀 공공 데이터 수집 시작");
        log.info("실행 시각: {}", LocalDateTime.now());
        log.info("========================================");

        int totalInserted = 0;
        int totalUpdated = 0;
        int totalSkipped = 0;

        try {
            // 1. KOPIS - 공연/전시 데이터 수집
            log.info("📚 [1/4] KOPIS 데이터 수집 시작...");
            IngestionResult kopisResult = ingestKopisData();
            totalInserted += kopisResult.inserted;
            totalUpdated += kopisResult.updated;
            totalSkipped += kopisResult.skipped;
            log.info("✅ KOPIS 수집 완료 - 신규: {}, 갱신: {}, 스킵: {}", 
                    kopisResult.inserted, kopisResult.updated, kopisResult.skipped);

            // 2. Seoul Open Data - 문화행사 데이터 수집
            log.info("🎭 [2/4] 서울시 열린데이터 수집 시작...");
            IngestionResult seoulResult = ingestSeoulEventData();
            totalInserted += seoulResult.inserted;
            totalUpdated += seoulResult.updated;
            totalSkipped += seoulResult.skipped;
            log.info("✅ 서울시 데이터 수집 완료 - 신규: {}, 갱신: {}, 스킵: {}", 
                    seoulResult.inserted, seoulResult.updated, seoulResult.skipped);

            // 3. Seoul Open Data - 모범음식점 데이터 수집
            log.info("🍽️ [3/4] 서울시 모범음식점 데이터 수집 시작...");
            IngestionResult restaurantResult = ingestSeoulRestaurantData();
            totalInserted += restaurantResult.inserted;
            totalUpdated += restaurantResult.updated;
            totalSkipped += restaurantResult.skipped;
            log.info("✅ 모범음식점 수집 완료 - 신규: {}, 갱신: {}, 스킵: {}", 
                    restaurantResult.inserted, restaurantResult.updated, restaurantResult.skipped);

            // 4. Data4Library - 도서관 데이터 수집
            log.info("📖 [4/4] 도서관정보나루 데이터 수집 시작...");
            IngestionResult libraryResult = ingestLibraryData();
            totalInserted += libraryResult.inserted;
            totalUpdated += libraryResult.updated;
            totalSkipped += libraryResult.skipped;
            log.info("✅ 도서관 데이터 수집 완료 - 신규: {}, 갱신: {}, 스킵: {}", 
                    libraryResult.inserted, libraryResult.updated, libraryResult.skipped);

            log.info("========================================");
            log.info("🎉 전체 데이터 수집 완료");
            log.info("📊 총 신규: {}, 갱신: {}, 스킵: {}", totalInserted, totalUpdated, totalSkipped);
            log.info("========================================");

        } catch (Exception e) {
            log.error("❌ 데이터 수집 중 오류 발생", e);
        }
    }

    /**
     * KOPIS API - 공연/전시 정보 수집
     * @return 수집 결과 통계
     */
    private IngestionResult ingestKopisData() {
        IngestionResult result = new IngestionResult();

        try {
            // 오늘부터 3개월 후까지의 공연 정보 조회
            String startDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String endDate = LocalDate.now().plusMonths(3).format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            String response = kopisWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/pblprfr")
                            .queryParam("service", kopisApiKey)
                            .queryParam("stdate", startDate)
                            .queryParam("eddate", endDate)
                            .queryParam("cpage", 1)
                            .queryParam("rows", 50)
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                // XML 파싱
                KopisResponse kopisResponse = xmlMapper.readValue(response, KopisResponse.class);
                
                if (kopisResponse.getPerformances() != null) {
                    log.info("KOPIS 공연 데이터 {}건 수신", kopisResponse.getPerformances().size());
                    
                    for (KopisResponse.Performance perf : kopisResponse.getPerformances()) {
                        try {
                            // 서울 지역만 수집
                            if (perf.getArea() != null && perf.getArea().contains("서울")) {
                                // 공연장 주소를 좌표로 변환 (간단 매핑 - 실제로는 상세 API 호출 필요)
                                GeoLocation geo = getCoordinatesFromFacilityName(perf.getFacilityName());
                                
                                Place place = new Place(
                                        perf.getName(),
                                        perf.getFacilityName() + " (서울)",  // 주소 대신 시설명 사용
                                        null,  // 상세 URL은 별도 API 호출 필요
                                        geo.latitude,
                                        geo.longitude,
                                        MissionCategory.CULTURE,
                                        perf.getPosterUrl()
                                );
                                
                                saveOrUpdatePlace(place, result);
                            }
                        } catch (Exception e) {
                            log.warn("공연 데이터 처리 실패: {}", perf.getName(), e);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("KOPIS 데이터 수집 실패", e);
        }

        return result;
    }

    /**
     * Seoul Open Data API - 문화행사 정보 수집
     * @return 수집 결과 통계
     */
    private IngestionResult ingestSeoulEventData() {
        IngestionResult result = new IngestionResult();

        try {
            String response = seoulWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(seoulApiKey, "json", "culturalEventInfo", "1", "100")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                // JSON 파싱
                SeoulEventResponse seoulResponse = objectMapper.readValue(response, SeoulEventResponse.class);
                
                if (seoulResponse.getCulturalEventInfo() != null 
                        && seoulResponse.getCulturalEventInfo().getEvents() != null) {
                    
                    List<SeoulEventResponse.Event> events = seoulResponse.getCulturalEventInfo().getEvents();
                    log.info("서울시 문화행사 데이터 {}건 수신", events.size());
                    
                    for (SeoulEventResponse.Event event : events) {
                        try {
                            // 장소 정보가 있는 경우만 처리
                            if (event.getPlace() != null && !event.getPlace().isEmpty()) {
                                
                                // 좌표가 제공되면 사용, 없으면 주소로 변환
                                Double latitude = parseDouble(event.getLatitude());
                                Double longitude = parseDouble(event.getLongitude());
                                
                                if (latitude == null || longitude == null) {
                                    GeoLocation geo = getCoordinatesFromAddress(event.getPlace());
                                    latitude = geo.latitude;
                                    longitude = geo.longitude;
                                }
                                
                                // 카테고리 결정 (분류 코드에 따라)
                                MissionCategory category = determineCategoryFromCodeName(event.getCodeName());
                                
                                Place place = new Place(
                                        event.getTitle(),
                                        event.getPlace(),
                                        event.getOrgLink() != null ? event.getOrgLink() : event.getHomepageAddr(),
                                        latitude,
                                        longitude,
                                        category,
                                        event.getMainImg()
                                );
                                
                                saveOrUpdatePlace(place, result);
                            }
                        } catch (Exception e) {
                            log.warn("행사 데이터 처리 실패: {}", event.getTitle(), e);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("서울시 데이터 수집 실패", e);
        }

        return result;
    }

    /**
     * Data4Library API - 도서관 정보 수집
     * @return 수집 결과 통계
     */
    private IngestionResult ingestLibraryData() {
        IngestionResult result = new IngestionResult();

        try {
            String response = libraryWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/libSrch")
                            .queryParam("authKey", libraryAuthKey)
                            .queryParam("region", "11")  // 서울
                            .queryParam("pageNo", 1)
                            .queryParam("pageSize", 50)
                            .queryParam("format", "xml")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                // XML 파싱
                LibraryResponse libraryResponse = xmlMapper.readValue(response, LibraryResponse.class);
                
                if (libraryResponse.getLibraries() != null) {
                    log.info("도서관 데이터 {}건 수신", libraryResponse.getLibraries().size());
                    
                    for (LibraryResponse.Library lib : libraryResponse.getLibraries()) {
                        try {
                            // 좌표 파싱
                            Double latitude = parseDouble(lib.getLatitude());
                            Double longitude = parseDouble(lib.getLongitude());
                            
                            // 좌표가 없으면 주소로 변환
                            if (latitude == null || longitude == null) {
                                GeoLocation geo = getCoordinatesFromAddress(lib.getAddress());
                                latitude = geo.latitude;
                                longitude = geo.longitude;
                            }
                            
                            Place place = new Place(
                                    lib.getName(),
                                    lib.getAddress(),
                                    lib.getHomepage(),
                                    latitude,
                                    longitude,
                                    MissionCategory.RELAX,  // 도서관은 휴식 카테고리
                                    null  // 도서관 이미지는 없음
                            );
                            
                            saveOrUpdatePlace(place, result);
                            
                        } catch (Exception e) {
                            log.warn("도서관 데이터 처리 실패: {}", lib.getName(), e);
                        }
                    }
                }
            }

        } catch (Exception e) {
            log.error("도서관 데이터 수집 실패", e);
        }

        return result;
    }

    /**
     * Seoul Open Data API - 모범음식점 지정 현황 수집
     * @return 수집 결과 통계
     */
    private IngestionResult ingestSeoulRestaurantData() {
        IngestionResult result = new IngestionResult();

        try {
            // 서울시 모범음식점 API 호출
            // 성동구 필터링은 응답 받은 후 처리
            String response = seoulWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .pathSegment(seoulApiKey, "json", "LOCALDATA_072405", "1", "1000")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                log.info("모범음식점 응답 수신: 길이={}", response.length());
                if (response.length() > 0) {
                    log.info("응답 내용(앞부분): {}", response.substring(0, Math.min(500, response.length())));
                }

                // JSON 파싱
                SeoulRestaurantResponse restaurantResponse = objectMapper.readValue(response, SeoulRestaurantResponse.class);
                
                if (restaurantResponse == null) {
                    log.error("restaurantResponse is null");
                } else if (restaurantResponse.getRestaurantData() == null) {
                    log.error("restaurantResponse.getRestaurantData() is null. JSON 키 불일치 가능성.");
                } else if (restaurantResponse.getRestaurantData().getRestaurants() == null) {
                    log.error("restaurantResponse.getRestaurantData().getRestaurants() is null.");
                }

                if (restaurantResponse != null 
                        && restaurantResponse.getRestaurantData() != null 
                        && restaurantResponse.getRestaurantData().getRestaurants() != null) {
                    
                    List<SeoulRestaurantResponse.Restaurant> restaurants = restaurantResponse.getRestaurantData().getRestaurants();
                    log.info("서울시 모범음식점 데이터 {}건 수신", restaurants.size());
                    
                    int seongdongCount = 0;
                    for (SeoulRestaurantResponse.Restaurant restaurant : restaurants) {
                        try {
                            // 성동구만 필터링
                            // if (!"성동구".equals(restaurant.getDistrictName())) {
                            //     continue;
                            // }
                            
                            seongdongCount++;
                            
                            // 영업 중인 업소만 수집
                            if (restaurant.getDetailStatusName() != null 
                                    && !restaurant.getDetailStatusName().contains("영업")) {
                                result.skipped++;
                                continue;
                            }
                            
                            // 좌표 처리 (정제된 좌표 우선 사용)
                            Double latitude = parseDouble(restaurant.getRefinedLatitude());
                            Double longitude = parseDouble(restaurant.getRefinedLongitude());
                            
                            // 정제된 좌표가 없으면 일반 좌표 사용
                            if (latitude == null || longitude == null) {
                                latitude = parseDouble(restaurant.getLatitude());
                                longitude = parseDouble(restaurant.getLongitude());
                            }
                            
                            // 좌표가 없으면 주소로 변환
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
                            
                            // 주소 선택 (정제된 도로명 주소 우선)
                            String address = restaurant.getRefinedRoadAddress();
                            if (address == null || address.isEmpty()) {
                                address = restaurant.getRoadAddress();
                            }
                            if (address == null || address.isEmpty()) {
                                address = restaurant.getFullAddress();
                            }
                            
                            // 업소명이 있는 경우만 저장
                            if (restaurant.getBusinessName() != null && !restaurant.getBusinessName().isEmpty()) {
                                Place place = new Place(
                                        restaurant.getBusinessName(),
                                        address,
                                        null,  // 음식점 홈페이지는 API에 없음
                                        latitude,
                                        longitude,
                                        MissionCategory.FOOD,  // 음식점은 FOOD 카테고리
                                        null  // 이미지 없음
                                );
                                
                                saveOrUpdatePlace(place, result);
                            }
                            
                        } catch (Exception e) {
                            log.warn("음식점 데이터 처리 실패: {}", restaurant.getBusinessName(), e);
                        }
                    }
                    
                    log.info("성동구 모범음식점 {}건 처리 완료", seongdongCount);
                }
            }

        } catch (Exception e) {
            log.error("모범음식점 데이터 수집 실패", e);
        }

        return result;
    }

    /**
     * Kakao Local API - 주소를 좌표로 변환 (Geocoding)
     * @param address 주소
     * @return 위도/경도 객체
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
                        log.debug("주소 좌표 변환 성공: {} -> ({}, {})", address, latitude, longitude);
                        return new GeoLocation(latitude, longitude);
                    }
                }
            }

        } catch (Exception e) {
            log.warn("주소 좌표 변환 실패: {}", address, e);
        }

        // 변환 실패 시 기본 좌표 (서울시청)
        log.debug("기본 좌표 사용: {}", address);
        return new GeoLocation(37.5665, 126.9780);
    }
    
    /**
     * 공연장 이름으로 간단한 좌표 매핑 (KOPIS는 주소 정보가 부족함)
     * 실제로는 별도 시설 정보 API를 호출해야 함
     */
    private GeoLocation getCoordinatesFromFacilityName(String facilityName) {
        // 주요 공연장 간단 매핑 (추후 확장 필요)
        if (facilityName != null) {
            if (facilityName.contains("예술의전당")) {
                return new GeoLocation(37.4781, 127.0117);
            } else if (facilityName.contains("세종문화회관")) {
                return new GeoLocation(37.5720, 126.9762);
            } else if (facilityName.contains("LG아트센터")) {
                return new GeoLocation(37.5274, 127.0402);
            }
        }
        // 기본 좌표 (서울시청)
        return new GeoLocation(37.5665, 126.9780);
    }
    
    /**
     * 서울시 문화행사 분류명에서 카테고리 결정
     */
    private MissionCategory determineCategoryFromCodeName(String codeName) {
        if (codeName == null) {
            return MissionCategory.CULTURE;
        }
        
        if (codeName.contains("공연") || codeName.contains("전시") || codeName.contains("영화")) {
            return MissionCategory.CULTURE;
        } else if (codeName.contains("체험") || codeName.contains("참여")) {
            return MissionCategory.ACTIVITY;
        } else if (codeName.contains("축제")) {
            return MissionCategory.ACTIVITY;
        } else {
            return MissionCategory.CULTURE;
        }
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

    /**
     * Place 저장 또는 업데이트
     * 중복 체크 후 신규 저장 / 스킵 처리
     * 
     * 참고: Place 엔티티가 불변 객체이므로 업데이트는 하지 않고,
     * 중복 시 스킵, 신규 데이터만 저장합니다.
     * 
     * @param place 저장할 장소
     * @param result 결과 통계 객체
     */
    private void saveOrUpdatePlace(Place place, IngestionResult result) {
        try {
            // 1. 이름과 주소로 중복 체크
            Optional<Place> existing = placeRepository.findByNameAndAddress(
                    place.getName(), 
                    place.getAddress()
            );

            if (existing.isPresent()) {
                // 중복 - 스킵
                result.skipped++;
                log.debug("⏭️ 스킵 (중복): {}", place.getName());
            } else {
                // 신규 저장
                placeRepository.save(place);
                result.inserted++;
                log.debug("✨ 신규 등록: {}", place.getName());
            }

        } catch (Exception e) {
            log.error("장소 저장 실패: {}", place.getName(), e);
        }
    }


    /**
     * 수집 결과 통계 내부 클래스
     */
    private static class IngestionResult {
        int inserted = 0;  // 신규 등록
        int updated = 0;   // 기존 데이터 갱신
        int skipped = 0;   // 중복 스킵
    }

    /**
     * 좌표 정보 내부 클래스
     */
    private static class GeoLocation {
        Double latitude;
        Double longitude;

        public GeoLocation(Double latitude, Double longitude) {
            this.latitude = latitude;
            this.longitude = longitude;
        }
    }

    /**
     * 수동 실행용 메서드 (개발/테스트 시 사용)
     * POST /api/admin/data-ingestion/trigger
     */
    @Transactional
    public void manualTrigger() {
        log.info("🔧 수동 데이터 수집 트리거");
        scheduleDataIngestion();
    }
}

