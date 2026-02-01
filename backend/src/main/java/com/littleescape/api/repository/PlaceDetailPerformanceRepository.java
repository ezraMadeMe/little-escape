package com.littleescape.api.repository;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.PlaceDetailPerformance;
import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.MissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlaceDetailPerformanceRepository extends JpaRepository<PlaceDetailPerformance, Long> {

    Optional<PlaceDetailPerformance> findByPlace(Place place);

    Optional<PlaceDetailPerformance> findByPlaceId(Long placeId);

    /**
     * 종료일이 지난 활성 공연 조회 (비활성화 대상)
     * PlaceRepository.findExpiredPerformances 대체
     */
    @Query("SELECT pd FROM PlaceDetailPerformance pd JOIN pd.place p " +
           "WHERE p.isActive = true AND pd.endDate < :today AND p.dataSource IN :dataSources")
    List<PlaceDetailPerformance> findExpiredByDataSources(
            @Param("today") LocalDate today,
            @Param("dataSources") List<DataSource> dataSources
    );

    /**
     * 공연 상태별 조회 (활성 장소만)
     * PlaceRepository.findByPerformanceStateAndIsActiveTrue 대체
     */
    @Query("SELECT pd FROM PlaceDetailPerformance pd JOIN pd.place p " +
           "WHERE pd.performanceState = :state AND p.isActive = true")
    List<PlaceDetailPerformance> findByPerformanceStateAndPlaceIsActiveTrue(
            @Param("state") String performanceState
    );

    /**
     * 가격 범위 내 활성 장소 조회 (무료 또는 지정 가격 이하)
     * PlaceRepository.findAffordablePlaces 대체
     */
    @Query("SELECT p FROM Place p LEFT JOIN PlaceDetailPerformance pd ON pd.place = p " +
           "WHERE p.isActive = true AND p.category = :category AND " +
           "(p.isFree = true OR pd.ticketPrice IS NULL OR pd.ticketPrice <= :maxPrice)")
    List<Place> findAffordablePlaces(
            @Param("category") MissionCategory category,
            @Param("maxPrice") Integer maxPrice
    );
}
