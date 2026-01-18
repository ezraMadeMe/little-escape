package com.littleescape.api.repository;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.type.MissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    @Query("SELECT p FROM Place p WHERE p.category = :category AND " +
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
    @Query("SELECT p FROM Place p WHERE " +
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
}
