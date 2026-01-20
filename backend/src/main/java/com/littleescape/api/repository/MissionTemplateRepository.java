package com.littleescape.api.repository;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.TimeOfDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MissionTemplateRepository extends JpaRepository<MissionTemplate, Long> {

    List<MissionTemplate> findAllByTimeOfDayInAndLocationTypeIn(
            List<TimeOfDay> timeOfDays,
            List<LocationType> locationTypes
    );

    /**
     * 카테고리 + 시간대 + 장소 타입으로 검색
     * (WeatherBasedPlanBScheduler용)
     */
    List<MissionTemplate> findByCategoryAndTimeOfDayAndLocationType(
            MissionCategory category,
            TimeOfDay timeOfDay,
            LocationType locationType
    );

    /**
     * 시간대 + 장소 타입으로 검색
     * (WeatherBasedPlanBScheduler용)
     */
    List<MissionTemplate> findByTimeOfDayAndLocationType(
            TimeOfDay timeOfDay,
            LocationType locationType
    );

    /**
     * 장소 타입으로 검색
     * (WeatherBasedPlanBScheduler용)
     */
    List<MissionTemplate> findByLocationType(LocationType locationType);

    /**
     * Haversine 공식을 사용한 거리 기반 미션 검색
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km)
     * @return 반경 내 미션 목록 (거리순 정렬)
     */
    @Query(value = """
        SELECT m.*, 
               (6371 * acos(
                   cos(radians(:latitude)) * 
                   cos(radians(m.latitude)) * 
                   cos(radians(m.longitude) - radians(:longitude)) + 
                   sin(radians(:latitude)) * 
                   sin(radians(m.latitude))
               )) AS distance
        FROM mission_templates m
        WHERE m.latitude IS NOT NULL 
          AND m.longitude IS NOT NULL
        HAVING distance <= :radiusKm
        ORDER BY distance
        """, nativeQuery = true)
    List<MissionTemplate> findByLocationWithinRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusKm") Integer radiusKm
    );

    /**
     * 시간대와 위치 타입 필터 + 거리 기반 검색
     */
    @Query(value = """
        SELECT m.*, 
               (6371 * acos(
                   cos(radians(:latitude)) * 
                   cos(radians(m.latitude)) * 
                   cos(radians(m.longitude) - radians(:longitude)) + 
                   sin(radians(:latitude)) * 
                   sin(radians(m.latitude))
               )) AS distance
        FROM mission_templates m
        WHERE m.latitude IS NOT NULL 
          AND m.longitude IS NOT NULL
          AND m.time_of_day IN (:timeOfDays)
          AND m.location_type IN (:locationTypes)
        HAVING distance <= :radiusKm
        ORDER BY distance
        """, nativeQuery = true)
    List<MissionTemplate> findByTimeOfDayAndLocationTypeWithinRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusKm") Integer radiusKm,
            @Param("timeOfDays") List<String> timeOfDays,
            @Param("locationTypes") List<String> locationTypes
    );
}
