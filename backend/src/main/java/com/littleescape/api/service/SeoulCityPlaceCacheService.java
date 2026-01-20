package com.littleescape.api.service;

import com.littleescape.api.domain.SeoulCityPlace;
import com.littleescape.api.domain.type.CongestionLevel;
import com.littleescape.api.dto.seoul.SeoulCityDataResponse;
import com.littleescape.api.dto.seoul.WeatherInfo;
import com.littleescape.api.repository.SeoulCityPlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 서울시 도시 장소 캐싱 서비스
 *
 * 역할:
 * 1. SeoulOpenApiService로부터 데이터를 받아 DB에 저장/갱신
 * 2. 캐시된 데이터 조회 및 필터링
 * 3. 오래된 데이터 관리 및 갱신
 *
 * 사용 시나리오:
 * - 스케줄러에서 주기적으로 refreshAllPlaces() 호출
 * - MissionService에서 혼잡도 기반 장소 필터링
 * - 사용자 위치 기반 근처 장소 추천
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SeoulCityPlaceCacheService {

    private final SeoulCityPlaceRepository repository;
    private final SeoulOpenApiService seoulOpenApiService;

    // ================================
    // 캐시 갱신 (CUD 작업)
    // ================================

    /**
     * 특정 장소 데이터 갱신
     *
     * @param placeCode 장소 코드
     */
    @Transactional
    public void refreshPlace(String placeCode) {
        log.info("=== 장소 데이터 갱신 시작 === 장소 코드: {}", placeCode);

        seoulOpenApiService.getCityDataByPlaceCode(placeCode)
                .subscribe(
                    response -> {
                        if (response.result() != null && response.result().isSuccess()) {
                            saveOrUpdatePlace(response);
                            log.info("=== 장소 데이터 갱신 완료 === {}", placeCode);
                        } else {
                            log.warn("API 응답 실패: {} - {}",
                                response.result().code(),
                                response.result().message());
                        }
                    },
                    error -> {
                        log.error("장소 데이터 갱신 실패: {} - {}", placeCode, error.getMessage());
                        markPlaceAsInvalid(placeCode);
                    }
                );
    }

    /**
     * 전체 장소 데이터 배치 갱신
     * 스케줄러에서 호출
     */
    @Transactional
    public void refreshAllPlaces() {
        log.info("=== 전체 장소 배치 갱신 시작 ===");

        seoulOpenApiService.getAllPlacesData()
                .subscribe(
                    response -> {
                        if (response.result() != null && response.result().isSuccess()) {
                            saveOrUpdatePlace(response);
                        }
                    },
                    error -> log.error("배치 갱신 중 에러: {}", error.getMessage()),
                    () -> {
                        log.info("=== 전체 장소 배치 갱신 완료 ===");
                        cleanupOldData();
                    }
                );
    }

    /**
     * 특정 장소 목록 배치 갱신
     *
     * @param placeCodes 갱신할 장소 코드 목록
     */
    @Transactional
    public void refreshPlaces(List<String> placeCodes) {
        log.info("=== 커스텀 배치 갱신 시작 === {}개 장소", placeCodes.size());

        seoulOpenApiService.getBatchCityData(placeCodes)
                .subscribe(
                    response -> {
                        if (response.result() != null && response.result().isSuccess()) {
                            saveOrUpdatePlace(response);
                        }
                    },
                    error -> log.error("배치 갱신 실패: {}", error.getMessage()),
                    () -> log.info("=== 커스텀 배치 갱신 완료 ===")
                );
    }

    /**
     * API 응답을 SeoulCityPlace 엔티티로 변환하여 저장/갱신
     *
     * @param response API 응답 DTO
     */
    @Transactional
    public void saveOrUpdatePlace(SeoulCityDataResponse response) {
        if (response.cityData() == null) {
            log.warn("CityData가 null입니다. 스킵합니다.");
            return;
        }

        SeoulCityDataResponse.CityData cityData = response.cityData();
        String placeCode = cityData.poiId();

        if (placeCode == null || placeCode.isEmpty()) {
            log.warn("장소 코드가 없습니다. 스킵합니다.");
            return;
        }

        // 기존 데이터 조회 또는 새로 생성
        SeoulCityPlace place = repository.findByPlaceCode(placeCode)
                .orElseGet(SeoulCityPlace::new);

        // 기본 정보 업데이트
        place.setPlaceCode(placeCode);
        place.setPlaceName(cityData.poiName());
        place.setAreaCode(cityData.areaCode());
        place.setAreaName(cityData.areaName());

        // 위치 정보
        place.setLatitude(cityData.getLatitude());
        place.setLongitude(cityData.getLongitude());

        // 혼잡도 정보
        place.setCongestionLevel(cityData.getCongestionLevelEnum());
        place.setCongestionMessage(cityData.areaCongestionMessage());
        place.setCurrentPopulationMin(cityData.getMinPopulation());
        place.setCurrentPopulationMax(cityData.getMaxPopulation());

        // 날씨 정보
        WeatherInfo weather = cityData.getCurrentWeather();
        if (weather != null) {
            place.setWeatherCondition(weather.skyStatus());
            place.setTemperature(weather.getTemperatureAsDouble());
            place.setSensibleTemperature(parseDouble(weather.sensibleTemp()));
            place.setRainfall(parseDouble(weather.rainfall()));
            place.setHumidity(parseInteger(weather.humidity()));
            place.setWindSpeed(parseDouble(weather.windSpeed()));
            place.setPm10(parseInteger(weather.pm10()));
            place.setPm25(parseInteger(weather.pm25()));
        }

        // 인구 통계 정보
        place.setMalePopulationRate(parseDouble(cityData.malePpltnRate()));
        place.setFemalePopulationRate(parseDouble(cityData.femalePpltnRate()));
        place.setResidentPopulationRate(parseDouble(cityData.resntPpltnRate()));
        place.setNonResidentPopulationRate(parseDouble(cityData.nonResntPpltnRate()));

        // 연령대별 인구 비율
        place.setAge10sRate(parseDouble(cityData.ppltnRate0()));
        place.setAge20sRate(parseDouble(cityData.ppltnRate10()));
        place.setAge30sRate(parseDouble(cityData.ppltnRate20()));
        place.setAge40sRate(parseDouble(cityData.ppltnRate30()));
        place.setAge50sRate(parseDouble(cityData.ppltnRate40()));
        place.setAge60sPlusRate(parseDouble(cityData.ppltnRate50()));

        // 메타데이터
        place.setLastUpdated(LocalDateTime.now());
        place.setApiResponseTime(parseDateTime(cityData.ppltnTime()));
        place.setIsValid(true);

        repository.save(place);
        log.debug("장소 저장 완료: {} ({})", place.getPlaceName(), placeCode);
    }

    /**
     * 장소를 무효화 처리
     *
     * @param placeCode 장소 코드
     */
    @Transactional
    public void markPlaceAsInvalid(String placeCode) {
        repository.findByPlaceCode(placeCode)
                .ifPresent(place -> {
                    place.setIsValid(false);
                    repository.save(place);
                    log.info("장소 무효화: {} ({})", place.getPlaceName(), placeCode);
                });
    }

    /**
     * 오래된 데이터 정리
     * 7일 이상 갱신되지 않은 무효 데이터 삭제
     */
    @Transactional
    public void cleanupOldData() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(7);
        List<SeoulCityPlace> oldPlaces = repository.findByIsValidFalse();

        long deletedCount = oldPlaces.stream()
                .filter(place -> place.getLastUpdated().isBefore(threshold))
                .peek(repository::delete)
                .count();

        if (deletedCount > 0) {
            log.info("오래된 데이터 {} 건 삭제 완료", deletedCount);
        }
    }

    // ================================
    // 캐시 조회 (Read 작업)
    // ================================

    /**
     * 장소 코드로 조회
     *
     * @param placeCode 장소 코드
     * @return 장소 데이터
     */
    public Optional<SeoulCityPlace> getPlace(String placeCode) {
        return repository.findByPlaceCode(placeCode);
    }

    /**
     * 유효한 전체 장소 조회
     *
     * @return 유효한 장소 목록
     */
    public List<SeoulCityPlace> getAllValidPlaces() {
        return repository.findByIsValidTrue();
    }

    /**
     * 혼잡하지 않은 장소 조회
     *
     * @return 여유 또는 보통인 장소 목록
     */
    public List<SeoulCityPlace> getLowCongestionPlaces() {
        return repository.findLowCongestionPlaces();
    }

    /**
     * 사용자 위치 근처 장소 조회
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km)
     * @return 반경 내 장소 목록
     */
    public List<SeoulCityPlace> getNearbyPlaces(Double latitude, Double longitude, Integer radiusKm) {
        return repository.findPlacesWithinRadius(latitude, longitude, radiusKm);
    }

    /**
     * 사용자 위치 근처 + 혼잡하지 않은 장소 조회
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km)
     * @return 조건을 만족하는 장소 목록
     */
    public List<SeoulCityPlace> getNearbyLowCongestionPlaces(
            Double latitude, Double longitude, Integer radiusKm
    ) {
        return repository.findLowCongestionPlacesWithinRadius(latitude, longitude, radiusKm);
    }

    /**
     * 가장 가까운 장소 찾기
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @return 가장 가까운 장소
     */
    public Optional<SeoulCityPlace> getNearestPlace(Double latitude, Double longitude) {
        return repository.findNearestPlace(latitude, longitude);
    }

    /**
     * 비가 오지 않는 장소 조회
     *
     * @return 비가 오지 않는 장소 목록
     */
    public List<SeoulCityPlace> getPlacesWithoutRain() {
        return repository.findPlacesWithoutRain();
    }

    /**
     * 추천 가능한 장소 조회
     * - 최근 60분 이내 갱신
     * - 혼잡도 보통 이하
     * - 공기질 좋음
     *
     * @return 추천 가능한 장소 목록
     */
    public List<SeoulCityPlace> getRecommendablePlaces() {
        LocalDateTime since = LocalDateTime.now().minusMinutes(60);
        return repository.findRecommendablePlaces(since);
    }

    /**
     * 갱신이 필요한 장소 조회
     *
     * @param maxAgeMinutes 최대 경과 시간 (분)
     * @return 갱신이 필요한 장소 목록
     */
    public List<SeoulCityPlace> getPlacesNeedingRefresh(int maxAgeMinutes) {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(maxAgeMinutes);
        return repository.findPlacesNeedingRefresh(threshold);
    }

    // ================================
    // 통계 조회
    // ================================

    /**
     * 유효한 장소 수 조회
     *
     * @return 장소 수
     */
    public long getValidPlaceCount() {
        return repository.countByIsValidTrue();
    }

    /**
     * 평균 혼잡도 레벨 조회
     *
     * @return 평균 혼잡도 (1.0 ~ 5.0)
     */
    public Double getAverageCongestionLevel() {
        return repository.getAverageCongestionLevel();
    }

    /**
     * 혼잡도별 장소 수 조회
     *
     * @param level 혼잡도 레벨
     * @return 해당 혼잡도의 장소 수
     */
    public long getPlaceCountByCongestionLevel(CongestionLevel level) {
        return repository.countByCongestionLevelAndIsValidTrue(level);
    }

    // ================================
    // 유틸리티 메서드
    // ================================

    /**
     * 문자열을 Double로 변환 (null-safe)
     */
    private Double parseDouble(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 문자열을 Integer로 변환 (null-safe)
     */
    private Integer parseInteger(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 문자열을 LocalDateTime으로 변환
     * 형식: "2024-01-20 15:30"
     */
    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            // TODO: 실제 API 응답 형식에 맞게 파싱 로직 조정 필요
            return LocalDateTime.parse(value.replace(" ", "T"));
        } catch (Exception e) {
            return null;
        }
    }
}
