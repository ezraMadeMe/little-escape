package com.littleescape.api.repository;

import com.littleescape.api.domain.SeoulCityPlace;
import com.littleescape.api.domain.type.CongestionLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 서울시 도시 장소 데이터 Repository
 *
 * 주요 기능:
 * - 장소 코드/이름으로 조회
 * - 혼잡도 기반 필터링
 * - 위치 기반 검색 (Haversine 공식)
 * - 날씨 조건 필터링
 * - 갱신 필요 데이터 조회
 */
@Repository
public interface SeoulCityPlaceRepository extends JpaRepository<SeoulCityPlace, Long> {

    // ================================
    // 기본 조회
    // ================================

    /**
     * 장소 코드로 조회
     *
     * @param placeCode 장소 코드 (예: "POI001")
     * @return 장소 데이터
     */
    Optional<SeoulCityPlace> findByPlaceCode(String placeCode);

    /**
     * 장소명으로 조회 (정확히 일치)
     *
     * @param placeName 장소명
     * @return 장소 데이터
     */
    Optional<SeoulCityPlace> findByPlaceName(String placeName);

    /**
     * 장소명으로 검색 (LIKE 검색)
     * 예: "강남" 입력 시 "강남역", "강남구청" 등 모두 조회
     *
     * @param placeName 검색할 장소명 (부분 일치)
     * @return 장소 목록
     */
    @Query("SELECT s FROM SeoulCityPlace s " +
           "WHERE s.isValid = true " +
           "AND s.placeName LIKE %:placeName% " +
           "ORDER BY s.placeName")
    List<SeoulCityPlace> searchByPlaceName(@Param("placeName") String placeName);

    /**
     * 장소 코드 목록으로 조회
     *
     * @param placeCodes 장소 코드 목록
     * @return 장소 데이터 목록
     */
    List<SeoulCityPlace> findByPlaceCodeIn(List<String> placeCodes);

    /**
     * 유효한 데이터만 전체 조회
     *
     * @return 유효한 장소 목록
     */
    List<SeoulCityPlace> findByIsValidTrue();

    // ================================
    // 혼잡도 기반 조회
    // ================================

    /**
     * 혼잡도 레벨로 조회 (유효한 데이터만)
     *
     * @param congestionLevel 혼잡도 레벨
     * @return 해당 혼잡도의 장소 목록
     */
    List<SeoulCityPlace> findByCongestionLevelAndIsValidTrue(CongestionLevel congestionLevel);

    /**
     * 혼잡도 레벨 목록으로 조회
     *
     * @param levels 혼잡도 레벨 목록
     * @return 해당 혼잡도의 장소 목록
     */
    List<SeoulCityPlace> findByCongestionLevelInAndIsValidTrue(List<CongestionLevel> levels);

    /**
     * 지정된 혼잡도 이하인 장소 조회
     * 예: NORMAL 이하 → SMOOTH, NORMAL만 조회
     *
     * @return 혼잡도가 낮은 장소 목록 (SMOOTH, NORMAL만)
     */
    @Query("SELECT s FROM SeoulCityPlace s " +
           "WHERE s.isValid = true " +
           "AND s.congestionLevel IN (com.littleescape.api.domain.type.CongestionLevel.SMOOTH, " +
           "                          com.littleescape.api.domain.type.CongestionLevel.NORMAL) " +
           "ORDER BY s.congestionLevel")
    List<SeoulCityPlace> findLowCongestionPlaces();

    /**
     * 혼잡도 레벨 숫자 기준 이하인 장소 조회
     * 레벨 매핑: 1=SMOOTH, 2=NORMAL, 3=SLIGHTLY_CROWDED, 4=CROWDED, 5=VERY_CROWDED
     *
     * 예: maxLevel=2 입력 시 → SMOOTH(1), NORMAL(2) 조회
     *
     * @param maxLevel 최대 혼잡도 레벨 (1~5)
     * @return 지정된 레벨 이하의 장소 목록
     */
    @Query(value = """
        SELECT s.*
        FROM seoul_city_places s
        WHERE s.is_valid = true
          AND CASE s.congestion_level
              WHEN 'SMOOTH' THEN 1
              WHEN 'NORMAL' THEN 2
              WHEN 'SLIGHTLY_CROWDED' THEN 3
              WHEN 'CROWDED' THEN 4
              WHEN 'VERY_CROWDED' THEN 5
              END <= :maxLevel
        ORDER BY s.congestion_level, s.place_name
        """, nativeQuery = true)
    List<SeoulCityPlace> findByCongestionLevelLessThanEqual(@Param("maxLevel") Integer maxLevel);

    // ================================
    // 위치 기반 조회 (Haversine 공식)
    // ================================

    /**
     * 사용자 위치 반경 내 장소 검색
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km)
     * @return 반경 내 장소 목록 (거리순 정렬)
     */
    @Query(value = """
        SELECT s.*,
               (6371 * acos(
                   cos(radians(:latitude)) *
                   cos(radians(s.latitude)) *
                   cos(radians(s.longitude) - radians(:longitude)) +
                   sin(radians(:latitude)) *
                   sin(radians(s.latitude))
               )) AS distance
        FROM seoul_city_places s
        WHERE s.is_valid = true
          AND s.latitude IS NOT NULL
          AND s.longitude IS NOT NULL
        HAVING distance <= :radiusKm
        ORDER BY distance
        """, nativeQuery = true)
    List<SeoulCityPlace> findPlacesWithinRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusKm") Integer radiusKm
    );

    /**
     * 반경 내 + 혼잡도 필터링 (SMOOTH, NORMAL만)
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km)
     * @return 조건을 만족하는 장소 목록
     */
    @Query(value = """
        SELECT s.*,
               (6371 * acos(
                   cos(radians(:latitude)) *
                   cos(radians(s.latitude)) *
                   cos(radians(s.longitude) - radians(:longitude)) +
                   sin(radians(:latitude)) *
                   sin(radians(s.latitude))
               )) AS distance
        FROM seoul_city_places s
        WHERE s.is_valid = true
          AND s.latitude IS NOT NULL
          AND s.longitude IS NOT NULL
          AND s.congestion_level IN ('SMOOTH', 'NORMAL')
        HAVING distance <= :radiusKm
        ORDER BY distance, s.congestion_level
        """, nativeQuery = true)
    List<SeoulCityPlace> findLowCongestionPlacesWithinRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusKm") Integer radiusKm
    );

    /**
     * 반경 내 + 혼잡도 필터링 (최대 혼잡도 지정 가능)
     *
     * MissionService 통합용 핵심 쿼리
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km)
     * @param congestionLevels 허용 혼잡도 목록 (예: ["SMOOTH", "NORMAL", "SLIGHTLY_CROWDED"])
     * @return 조건을 만족하는 장소 목록 (거리순 정렬)
     */
    @Query(value = """
        SELECT s.*,
               (6371 * acos(
                   cos(radians(:latitude)) *
                   cos(radians(s.latitude)) *
                   cos(radians(s.longitude) - radians(:longitude)) +
                   sin(radians(:latitude)) *
                   sin(radians(s.latitude))
               )) AS distance
        FROM seoul_city_places s
        WHERE s.is_valid = true
          AND s.latitude IS NOT NULL
          AND s.longitude IS NOT NULL
          AND s.congestion_level IN (:congestionLevels)
        HAVING distance <= :radiusKm
        ORDER BY distance, s.congestion_level
        """, nativeQuery = true)
    List<SeoulCityPlace> findNearbyPlacesWithCongestionFilter(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusKm") Integer radiusKm,
            @Param("congestionLevels") List<String> congestionLevels
    );

    /**
     * 가장 가까운 장소 찾기
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @return 가장 가까운 장소
     */
    @Query(value = """
        SELECT s.*,
               (6371 * acos(
                   cos(radians(:latitude)) *
                   cos(radians(s.latitude)) *
                   cos(radians(s.longitude) - radians(:longitude)) +
                   sin(radians(:latitude)) *
                   sin(radians(s.latitude))
               )) AS distance
        FROM seoul_city_places s
        WHERE s.is_valid = true
          AND s.latitude IS NOT NULL
          AND s.longitude IS NOT NULL
        ORDER BY distance
        LIMIT 1
        """, nativeQuery = true)
    Optional<SeoulCityPlace> findNearestPlace(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude
    );

    // ================================
    // 날씨 기반 조회
    // ================================

    /**
     * 비가 오지 않는 장소 조회
     *
     * @return 비가 오지 않는 장소 목록
     */
    @Query("SELECT s FROM SeoulCityPlace s " +
           "WHERE s.isValid = true " +
           "AND (s.rainfall IS NULL OR s.rainfall = 0)")
    List<SeoulCityPlace> findPlacesWithoutRain();

    /**
     * 맑은 날씨인 장소 조회
     *
     * @return 맑은 날씨의 장소 목록
     */
    @Query("SELECT s FROM SeoulCityPlace s " +
           "WHERE s.isValid = true " +
           "AND s.weatherCondition LIKE '%맑음%'")
    List<SeoulCityPlace> findPlacesWithClearWeather();

    /**
     * 좋은 공기질 장소 조회 (PM2.5 기준 35 이하)
     *
     * @return 공기질이 좋은 장소 목록
     */
    @Query("SELECT s FROM SeoulCityPlace s " +
           "WHERE s.isValid = true " +
           "AND (s.pm25 IS NULL OR s.pm25 <= 35)")
    List<SeoulCityPlace> findPlacesWithGoodAirQuality();

    // ================================
    // 갱신 관리
    // ================================

    /**
     * 갱신이 필요한 장소 조회
     * 마지막 갱신 시간이 지정된 시간보다 오래된 데이터
     *
     * @param threshold 기준 시간
     * @return 갱신이 필요한 장소 목록
     */
    @Query("SELECT s FROM SeoulCityPlace s " +
           "WHERE s.lastUpdated < :threshold " +
           "OR s.isValid = false")
    List<SeoulCityPlace> findPlacesNeedingRefresh(@Param("threshold") LocalDateTime threshold);

    /**
     * 특정 시간 이후 갱신된 장소 조회
     *
     * @param since 기준 시간
     * @return 최근 갱신된 장소 목록
     */
    List<SeoulCityPlace> findByLastUpdatedAfter(LocalDateTime since);

    /**
     * 유효하지 않은 데이터 조회
     *
     * @return 유효하지 않은 장소 목록
     */
    List<SeoulCityPlace> findByIsValidFalse();

    // ================================
    // 통계 쿼리
    // ================================

    /**
     * 전체 장소 수 조회
     *
     * @return 장소 수
     */
    long countByIsValidTrue();

    /**
     * 혼잡도별 장소 수 조회
     *
     * @param congestionLevel 혼잡도
     * @return 해당 혼잡도의 장소 수
     */
    long countByCongestionLevelAndIsValidTrue(CongestionLevel congestionLevel);

    /**
     * 혼잡도별 장소 수 조회 (SeoulDataController용 alias)
     *
     * @param congestionLevel 혼잡도
     * @return 해당 혼잡도의 장소 수
     */
    default long getPlaceCountByCongestionLevel(CongestionLevel congestionLevel) {
        return countByCongestionLevelAndIsValidTrue(congestionLevel);
    }

    /**
     * 평균 혼잡도 계산
     * (SMOOTH=1, NORMAL=2, SLIGHTLY_CROWDED=3, CROWDED=4, VERY_CROWDED=5)
     *
     * @return 평균 혼잡도 레벨
     */
    @Query("SELECT AVG(CASE s.congestionLevel " +
           "WHEN com.littleescape.api.domain.type.CongestionLevel.SMOOTH THEN 1 " +
           "WHEN com.littleescape.api.domain.type.CongestionLevel.NORMAL THEN 2 " +
           "WHEN com.littleescape.api.domain.type.CongestionLevel.SLIGHTLY_CROWDED THEN 3 " +
           "WHEN com.littleescape.api.domain.type.CongestionLevel.CROWDED THEN 4 " +
           "WHEN com.littleescape.api.domain.type.CongestionLevel.VERY_CROWDED THEN 5 " +
           "END) " +
           "FROM SeoulCityPlace s WHERE s.isValid = true")
    Double getAverageCongestionLevel();

    // ================================
    // 복합 조건 조회
    // ================================

    /**
     * 추천 가능한 장소 조회
     * - 최근 60분 이내 갱신
     * - 혼잡도 보통 이하
     * - 공기질 좋음
     *
     * @param since 기준 시간 (60분 전)
     * @return 추천 가능한 장소 목록
     */
    @Query("SELECT s FROM SeoulCityPlace s " +
           "WHERE s.isValid = true " +
           "AND s.lastUpdated > :since " +
           "AND s.congestionLevel IN (com.littleescape.api.domain.type.CongestionLevel.SMOOTH, " +
           "                          com.littleescape.api.domain.type.CongestionLevel.NORMAL) " +
           "AND (s.pm25 IS NULL OR s.pm25 <= 35) " +
           "ORDER BY s.congestionLevel, s.placeName")
    List<SeoulCityPlace> findRecommendablePlaces(@Param("since") LocalDateTime since);
}
