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
}
