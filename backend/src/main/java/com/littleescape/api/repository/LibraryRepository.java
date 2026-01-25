package com.littleescape.api.repository;

import com.littleescape.api.domain.Library;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 도서관 정보 Repository
 */
@Repository
public interface LibraryRepository extends JpaRepository<Library, Long> {

    /**
     * 도서관 코드로 조회
     */
    Optional<Library> findByLibraryCode(String libraryCode);

    /**
     * 도서관 코드 존재 여부 확인
     */
    boolean existsByLibraryCode(String libraryCode);

    /**
     * 이름으로 도서관 검색 (부분 일치)
     */
    List<Library> findByNameContaining(String name);

    /**
     * 정보공개 도서관 전체 조회
     */
    List<Library> findByIsOpenForDisclosureTrue();

    /**
     * 좌표 범위 내 도서관 조회
     */
    @Query("SELECT l FROM Library l WHERE " +
           "l.latitude BETWEEN :minLat AND :maxLat AND " +
           "l.longitude BETWEEN :minLon AND :maxLon")
    List<Library> findWithinBounds(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLon") Double minLon,
            @Param("maxLon") Double maxLon
    );

    /**
     * 사용자 위치에서 가까운 도서관 조회 (Haversine 공식)
     * 반경 거리(km) 내의 도서관만 조회
     */
    @Query(value = """
        SELECT * FROM libraries l
        WHERE l.latitude IS NOT NULL AND l.longitude IS NOT NULL
        AND (6371 * acos(cos(radians(:userLat)) * cos(radians(l.latitude))
            * cos(radians(l.longitude) - radians(:userLon))
            + sin(radians(:userLat)) * sin(radians(l.latitude)))) <= :radiusKm
        ORDER BY (6371 * acos(cos(radians(:userLat)) * cos(radians(l.latitude))
            * cos(radians(l.longitude) - radians(:userLon))
            + sin(radians(:userLat)) * sin(radians(l.latitude)))) ASC
        """, nativeQuery = true)
    List<Library> findNearbyLibraries(
            @Param("userLat") Double userLat,
            @Param("userLon") Double userLon,
            @Param("radiusKm") Double radiusKm
    );

    /**
     * 도서관 코드 목록으로 조회
     */
    List<Library> findByLibraryCodeIn(List<String> libraryCodes);
}
