package com.littleescape.api.repository;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.MissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlaceRepository extends JpaRepository<Place, Long> {
    List<Place> findByCategory(MissionCategory category);

    /**
     * 중복 체크: 이름과 주소로 장소 검색
     * 데이터 수집 시 중복 방지용
     */
    Optional<Place> findByNameAndAddress(String name, String address);

    /**
     * 중복 체크: 이름만으로 장소 검색
     * 주소가 없는 경우 사용
     */
    Optional<Place> findByName(String name);

    /**
     * 특정 카테고리의 장소 개수 조회
     */
    @Query("SELECT COUNT(p) FROM Place p WHERE p.category = :category")
    long countByCategory(@Param("category") MissionCategory category);

    /**
     * 특정 좌표 범위 내의 장소 검색
     * 반경 내 중복 체크용
     */
    @Query("SELECT p FROM Place p WHERE " +
            "p.latitude BETWEEN :minLat AND :maxLat AND " +
            "p.longitude BETWEEN :minLon AND :maxLon")
    List<Place> findWithinBounds(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLon") Double minLon,
            @Param("maxLon") Double maxLon
    );

    /**
     * 필터링된 양질의 장소 조회 (카테고리별)
     * 1인 가구 타겟에 맞지 않는 키워드 제외
     */
    @Query("SELECT p FROM Place p WHERE p.category = :category AND " +
            "p.name NOT LIKE %:keyword1% AND p.name NOT LIKE %:keyword2% AND " +
            "p.name NOT LIKE %:keyword3% AND p.name NOT LIKE %:keyword4% AND " +
            "p.name NOT LIKE %:keyword5% AND p.name NOT LIKE %:keyword6% AND " +
            "p.name NOT LIKE %:keyword7%")
    List<Place> findByCategoryFiltered(
            @Param("category") MissionCategory category,
            @Param("keyword1") String keyword1,
            @Param("keyword2") String keyword2,
            @Param("keyword3") String keyword3,
            @Param("keyword4") String keyword4,
            @Param("keyword5") String keyword5,
            @Param("keyword6") String keyword6,
            @Param("keyword7") String keyword7
    );

    /**
     * 필터링된 양질의 장소 조회 (카테고리 무관 fallback)
     * 1인 가구 타겟에 맞지 않는 키워드 제외
     */
    @Query("SELECT p FROM Place p WHERE " +
            "p.name NOT LIKE %:keyword1% AND p.name NOT LIKE %:keyword2% AND " +
            "p.name NOT LIKE %:keyword3% AND p.name NOT LIKE %:keyword4% AND " +
            "p.name NOT LIKE %:keyword5% AND p.name NOT LIKE %:keyword6% AND " +
            "p.name NOT LIKE %:keyword7%")
    List<Place> findAllFiltered(
            @Param("keyword1") String keyword1,
            @Param("keyword2") String keyword2,
            @Param("keyword3") String keyword3,
            @Param("keyword4") String keyword4,
            @Param("keyword5") String keyword5,
            @Param("keyword6") String keyword6,
            @Param("keyword7") String keyword7
    );

    /**
     * 필터링된 양질의 장소 조회 (카테고리별 + 거리 제한)
     * 사용자 위치 기준 반경 10km 이내 + 1인 가구 타겟 키워드 필터링
     *
     * 성능 최적화를 위해 2단계 필터링:
     * 1) 위/경도 차이 0.1 이내 (약 11km) - 인덱스 활용 가능
     * 2) 하버사인 공식으로 정확한 거리 10km 이내 필터링
     */
    @Query("SELECT p FROM Place p " +
            "LEFT JOIN FETCH p.performanceDetail " +
            "LEFT JOIN FETCH p.facilityDetail " +
            "WHERE p.category = :category AND " +
            "p.isActive = true AND " +
            "ABS(p.latitude - :userLat) <= 0.1 AND " +
            "ABS(p.longitude - :userLon) <= 0.1 AND " +
            "(6371 * acos(cos(radians(:userLat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:userLon)) + " +
            "sin(radians(:userLat)) * sin(radians(p.latitude)))) <= 10 AND " +
            "p.name NOT LIKE %:keyword1% AND p.name NOT LIKE %:keyword2% AND " +
            "p.name NOT LIKE %:keyword3% AND p.name NOT LIKE %:keyword4% AND " +
            "p.name NOT LIKE %:keyword5% AND p.name NOT LIKE %:keyword6% AND " +
            "p.name NOT LIKE %:keyword7%")
    List<Place> findByCategoryFilteredWithDistance(
            @Param("category") MissionCategory category,
            @Param("userLat") Double userLatitude,
            @Param("userLon") Double userLongitude,
            @Param("keyword1") String keyword1,
            @Param("keyword2") String keyword2,
            @Param("keyword3") String keyword3,
            @Param("keyword4") String keyword4,
            @Param("keyword5") String keyword5,
            @Param("keyword6") String keyword6,
            @Param("keyword7") String keyword7
    );

    /**
     * 필터링된 양질의 장소 조회 (카테고리 무관 fallback + 거리 제한)
     * 사용자 위치 기준 반경 10km 이내 + 1인 가구 타겟 키워드 필터링
     */
    @Query("SELECT p FROM Place p " +
            "LEFT JOIN FETCH p.performanceDetail " +
            "LEFT JOIN FETCH p.facilityDetail " +
            "WHERE " +
            "p.isActive = true AND " +
            "ABS(p.latitude - :userLat) <= 0.1 AND " +
            "ABS(p.longitude - :userLon) <= 0.1 AND " +
            "(6371 * acos(cos(radians(:userLat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:userLon)) + " +
            "sin(radians(:userLat)) * sin(radians(p.latitude)))) <= 10 AND " +
            "p.name NOT LIKE %:keyword1% AND p.name NOT LIKE %:keyword2% AND " +
            "p.name NOT LIKE %:keyword3% AND p.name NOT LIKE %:keyword4% AND " +
            "p.name NOT LIKE %:keyword5% AND p.name NOT LIKE %:keyword6% AND " +
            "p.name NOT LIKE %:keyword7%")
    List<Place> findAllFilteredWithDistance(
            @Param("userLat") Double userLatitude,
            @Param("userLon") Double userLongitude,
            @Param("keyword1") String keyword1,
            @Param("keyword2") String keyword2,
            @Param("keyword3") String keyword3,
            @Param("keyword4") String keyword4,
            @Param("keyword5") String keyword5,
            @Param("keyword6") String keyword6,
            @Param("keyword7") String keyword7
    );

    /**
     * 카테고리별 + 거리 제한 장소 조회 (키워드 필터링 없음)
     * ContentFilteringService를 통해 애플리케이션 레벨에서 필터링
     */
    @Query("SELECT p FROM Place p " +
            "LEFT JOIN FETCH p.performanceDetail " +
            "LEFT JOIN FETCH p.facilityDetail " +
            "WHERE p.category = :category AND " +
            "p.isActive = true AND " +
            "ABS(p.latitude - :userLat) <= 0.1 AND " +
            "ABS(p.longitude - :userLon) <= 0.1 AND " +
            "(6371 * acos(cos(radians(:userLat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:userLon)) + " +
            "sin(radians(:userLat)) * sin(radians(p.latitude)))) <= 10")
    List<Place> findByCategoryWithDistance(
            @Param("category") MissionCategory category,
            @Param("userLat") Double userLatitude,
            @Param("userLon") Double userLongitude
    );

    /**
     * 전체 장소 + 거리 제한 조회 (키워드 필터링 없음)
     * ContentFilteringService를 통해 애플리케이션 레벨에서 필터링
     */
    @Query("SELECT p FROM Place p " +
            "LEFT JOIN FETCH p.performanceDetail " +
            "LEFT JOIN FETCH p.facilityDetail " +
            "WHERE p.isActive = true AND " +
            "ABS(p.latitude - :userLat) <= 0.1 AND " +
            "ABS(p.longitude - :userLon) <= 0.1 AND " +
            "(6371 * acos(cos(radians(:userLat)) * cos(radians(p.latitude)) * " +
            "cos(radians(p.longitude) - radians(:userLon)) + " +
            "sin(radians(:userLat)) * sin(radians(p.latitude)))) <= 10")
    List<Place> findAllWithDistance(
            @Param("userLat") Double userLatitude,
            @Param("userLon") Double userLongitude
    );

    // ========== 신규 메서드 (데이터 수집용) ==========

    /**
     * 외부 API ID로 장소 조회 (upsert용)
     */
    Optional<Place> findByExternalId(String externalId);

    /**
     * 외부 API ID 존재 여부 확인
     */
    boolean existsByExternalId(String externalId);

    /**
     * 데이터 소스별 장소 조회
     */
    List<Place> findByDataSource(DataSource dataSource);

    /**
     * 데이터 소스별 장소 개수
     */
    long countByDataSource(DataSource dataSource);

    /**
     * 활성 장소만 조회 (종료되지 않은)
     */
    List<Place> findByIsActiveTrue();

    /**
     * 활성 + 카테고리별 장소 조회
     */
    List<Place> findByCategoryAndIsActiveTrue(MissionCategory category);

    /**
     * @deprecated PlaceDetailPerformanceRepository.findExpiredByDataSources 로 이관
     * 종료일이 지난 활성 공연 조회 (비활성화 대상)
     */
    @Deprecated
    @Query("SELECT p FROM Place p WHERE p.isActive = true AND p.endDate < :today AND p.dataSource = :dataSource")
    List<Place> findExpiredPerformances(
            @Param("today") LocalDate today,
            @Param("dataSource") DataSource dataSource
    );

    /**
     * @deprecated detail 테이블 기반 deactivate 로직으로 전환 중 (레거시 fallback용 유지)
     * 종료된 공연 일괄 비활성화 (hub 컬럼 기준)
     */
    @Deprecated
    @Modifying
    @Query("UPDATE Place p SET p.isActive = false, p.performanceState = '공연완료' " +
           "WHERE p.isActive = true AND p.endDate < :today AND p.dataSource IN :dataSources")
    int deactivateExpiredPerformances(
            @Param("today") LocalDate today,
            @Param("dataSources") List<DataSource> dataSources
    );

    /**
     * 데이터 소스 + 카테고리별 활성 장소 조회
     */
    List<Place> findByDataSourceAndCategoryAndIsActiveTrue(DataSource dataSource, MissionCategory category);

    /**
     * @deprecated PlaceDetailPerformanceRepository.findAffordablePlaces 로 이관
     * 가격 범위 내 활성 장소 조회 (무료 또는 지정 가격 이하)
     */
    @Deprecated
    @Query("SELECT p FROM Place p WHERE p.isActive = true AND p.category = :category AND " +
           "(p.isFree = true OR p.ticketPrice IS NULL OR p.ticketPrice <= :maxPrice)")
    List<Place> findAffordablePlaces(
            @Param("category") MissionCategory category,
            @Param("maxPrice") Integer maxPrice
    );

    /**
     * @deprecated PlaceDetailPerformanceRepository.findByPerformanceStateAndPlaceIsActiveTrue 로 이관
     * 공연 상태별 조회
     */
    @Deprecated
    List<Place> findByPerformanceStateAndIsActiveTrue(String performanceState);
}
