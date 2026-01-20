package com.littleescape.api.service;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.SeoulCityPlace;
import com.littleescape.api.domain.type.CongestionLevel;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.TimeOfDay;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.repository.SeoulCityPlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 실시간 도시데이터 기반 미션 추천 서비스
 *
 * 기존 MissionService를 확장하여 실시간 혼잡도와 날씨를 고려한 추천 제공
 *
 * 추천 알고리즘:
 * 1. 시간대 필터링 (MORNING/AFTERNOON/NIGHT)
 * 2. 사용자 위치 기반 근처 장소 찾기
 * 3. 실시간 혼잡도 확인
 * 4. 날씨 상태 확인
 * 5. 조건에 맞는 미션 추천
 *
 * 차별화 포인트:
 * - 붐비는 시간대/장소 자동 회피
 * - 비 오면 실내 미션 자동 전환
 * - 공기질 나쁘면 실내 미션 우선 추천
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MissionRecommendationService {

    private final MissionTemplateRepository missionRepository;
    private final SeoulCityPlaceRepository seoulPlaceRepository;

    // 혼잡도 필터링 기준: 보통(2) 이하만 추천
    private static final int MAX_ACCEPTABLE_CONGESTION_LEVEL = 2;

    // 기본 검색 반경 (km)
    private static final int DEFAULT_RADIUS_KM = 5;
    // 확장 검색 반경 (근처에 추천 장소 없을 때)
    private static final int EXTENDED_RADIUS_KM = 10;

    /**
     * 실시간 도시데이터 기반 미션 추천
     *
     * @param scheduledAt 약속 예정 시간
     * @param userLatitude 사용자 위도
     * @param userLongitude 사용자 경도
     * @return 추천 미션 목록 (최대 4개)
     */
    public List<MissionTemplate> getRealtimeRecommendations(
            LocalDateTime scheduledAt,
            Double userLatitude,
            Double userLongitude
    ) {
        log.info("=== 실시간 도시데이터 기반 미션 추천 시작 ===");
        log.info("시간: {}, 위치: ({}, {})", scheduledAt, userLatitude, userLongitude);

        // 1. 시간대 분석
        List<TimeOfDay> targetTimes = analyzeTimeOfDay(scheduledAt);
        log.info("추천 시간대: {}", targetTimes);

        // 2. 사용자 근처 장소 찾기
        Optional<SeoulCityPlace> nearestPlace = seoulPlaceRepository.findNearestPlace(
            userLatitude, userLongitude
        );

        if (nearestPlace.isEmpty()) {
            log.warn("근처에 도시데이터가 없습니다. 기본 추천 로직 사용");
            return getBasicRecommendations(scheduledAt);
        }

        SeoulCityPlace place = nearestPlace.get();
        log.info("가장 가까운 장소: {}", place.getSummary());

        // 3. 날씨 기반 장소 타입 결정
        List<LocationType> targetLocations = analyzeLocationWithWeather(place);
        log.info("추천 장소 타입: {}", targetLocations);

        // 4. 혼잡도 기반 장소 필터링
        List<SeoulCityPlace> recommendablePlaces = getRecommendablePlaces(
            userLatitude, userLongitude, place
        );

        // 5. 조건에 맞는 미션 추천
        List<MissionTemplate> missions = findMissionsNearPlaces(
            recommendablePlaces, targetTimes, targetLocations
        );

        // 6. 미션이 부족하면 반경 확장
        if (missions.size() < 4) {
            log.info("미션 부족 ({}개). 반경 확장 검색", missions.size());
            List<MissionTemplate> additionalMissions = findMissionsWithExtendedRadius(
                userLatitude, userLongitude, targetTimes, targetLocations
            );
            missions.addAll(additionalMissions);
        }

        // 7. 중복 제거 및 최대 4개 반환
        List<MissionTemplate> result = missions.stream()
                .distinct()
                .limit(4)
                .collect(Collectors.toList());

        log.info("=== 추천 완료 === {}개 미션 반환", result.size());
        return result;
    }

    /**
     * 혼잡도 기반 Plan B 추천
     *
     * 원래 미션이 너무 붐비는 장소인 경우 대안 제시
     *
     * @param originalMissionId 원래 미션 ID
     * @param userLatitude 사용자 위도
     * @param userLongitude 사용자 경도
     * @return Plan B 미션
     */
    public Optional<MissionTemplate> getPlanBWithCongestion(
            Long originalMissionId,
            Double userLatitude,
            Double userLongitude
    ) {
        log.info("=== 혼잡도 기반 Plan B 추천 ===");

        // 1. 원래 미션 조회
        Optional<MissionTemplate> originalMission = missionRepository.findById(originalMissionId);
        if (originalMission.isEmpty()) {
            return Optional.empty();
        }

        // 2. 여유 있는 장소 찾기
        List<SeoulCityPlace> lowCongestionPlaces = seoulPlaceRepository
                .findLowCongestionPlacesWithinRadius(
                    userLatitude, userLongitude, EXTENDED_RADIUS_KM
                );

        if (lowCongestionPlaces.isEmpty()) {
            log.info("근처에 여유 있는 장소가 없습니다.");
            return Optional.empty();
        }

        // 3. 여유 있는 장소 근처의 실내 미션 찾기
        List<MissionTemplate> planBCandidates = findIndoorMissionsNearPlaces(lowCongestionPlaces);

        if (planBCandidates.isEmpty()) {
            return Optional.empty();
        }

        // 4. 랜덤 선택
        Random random = new Random();
        MissionTemplate planB = planBCandidates.get(random.nextInt(planBCandidates.size()));

        log.info("Plan B 선택: {} ({})", planB.getTitle(), planB.getId());
        return Optional.of(planB);
    }

    // ================================
    // Private Helper Methods
    // ================================

    /**
     * 시간대 분석
     */
    private List<TimeOfDay> analyzeTimeOfDay(LocalDateTime scheduledAt) {
        int hour = scheduledAt.getHour();
        List<TimeOfDay> times = new ArrayList<>();

        if (hour >= 6 && hour < 12) {
            times.add(TimeOfDay.MORNING);
        } else if (hour >= 12 && hour < 18) {
            times.add(TimeOfDay.AFTERNOON);
        } else {
            times.add(TimeOfDay.NIGHT);
        }

        times.add(TimeOfDay.ANY);
        return times;
    }

    /**
     * 날씨 기반 장소 타입 분석
     */
    private List<LocationType> analyzeLocationWithWeather(SeoulCityPlace place) {
        List<LocationType> locations = new ArrayList<>();

        // 비가 오거나 공기질이 나쁘면 실내 우선
        if (place.isRainy() || !place.isGoodAirQuality()) {
            log.info("날씨/공기질 나쁨 → 실내 미션 우선 (비: {}, PM2.5: {})",
                place.isRainy(), place.getPm25());
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.ANY);
        } else {
            // 날씨 좋으면 실외도 포함
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.OUTDOOR);
            locations.add(LocationType.ANY);
        }

        return locations;
    }

    /**
     * 추천 가능한 장소 목록 조회
     */
    private List<SeoulCityPlace> getRecommendablePlaces(
            Double latitude,
            Double longitude,
            SeoulCityPlace nearestPlace
    ) {
        // 근처가 붐비면 더 넓은 범위 검색
        CongestionLevel nearestCongestion = nearestPlace.getCongestionLevel();

        if (nearestCongestion == CongestionLevel.CROWDED ||
            nearestCongestion == CongestionLevel.VERY_CROWDED) {
            log.info("근처가 붐빔 → 반경 {}km로 여유 있는 장소 검색", EXTENDED_RADIUS_KM);

            return seoulPlaceRepository.findLowCongestionPlacesWithinRadius(
                latitude, longitude, EXTENDED_RADIUS_KM
            );
        }

        // 근처가 여유 있으면 기본 반경 사용
        log.info("근처가 여유로움 → 반경 {}km 검색", DEFAULT_RADIUS_KM);

        return seoulPlaceRepository.findPlacesWithinRadius(
            latitude, longitude, DEFAULT_RADIUS_KM
        );
    }

    /**
     * 장소 근처의 미션 찾기
     */
    private List<MissionTemplate> findMissionsNearPlaces(
            List<SeoulCityPlace> places,
            List<TimeOfDay> targetTimes,
            List<LocationType> targetLocations
    ) {
        if (places.isEmpty()) {
            return Collections.emptyList();
        }

        List<MissionTemplate> missions = new ArrayList<>();

        for (SeoulCityPlace place : places) {
            // 각 장소 근처 2km 반경의 미션 찾기
            List<String> timeStrings = targetTimes.stream()
                    .map(Enum::name)
                    .collect(Collectors.toList());

            List<String> locationStrings = targetLocations.stream()
                    .map(Enum::name)
                    .collect(Collectors.toList());

            List<MissionTemplate> nearbyMissions = missionRepository
                    .findByTimeOfDayAndLocationTypeWithinRadius(
                        place.getLatitude(), place.getLongitude(), 2,
                        timeStrings, locationStrings
                    );

            missions.addAll(nearbyMissions);

            // 충분한 미션 확보 시 종료
            if (missions.size() >= 10) {
                break;
            }
        }

        Collections.shuffle(missions);
        return missions;
    }

    /**
     * 실내 미션만 찾기
     */
    private List<MissionTemplate> findIndoorMissionsNearPlaces(List<SeoulCityPlace> places) {
        List<MissionTemplate> missions = new ArrayList<>();

        for (SeoulCityPlace place : places) {
            List<MissionTemplate> nearbyMissions = missionRepository
                    .findByLocationWithinRadius(
                        place.getLatitude(), place.getLongitude(), 2
                    );

            List<MissionTemplate> indoorMissions = nearbyMissions.stream()
                    .filter(m -> m.getLocationType() == LocationType.INDOOR)
                    .collect(Collectors.toList());

            missions.addAll(indoorMissions);

            if (missions.size() >= 5) {
                break;
            }
        }

        return missions;
    }

    /**
     * 확장 반경으로 미션 찾기
     */
    private List<MissionTemplate> findMissionsWithExtendedRadius(
            Double latitude,
            Double longitude,
            List<TimeOfDay> targetTimes,
            List<LocationType> targetLocations
    ) {
        List<String> timeStrings = targetTimes.stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        List<String> locationStrings = targetLocations.stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        return missionRepository.findByTimeOfDayAndLocationTypeWithinRadius(
            latitude, longitude, EXTENDED_RADIUS_KM,
            timeStrings, locationStrings
        );
    }

    /**
     * 기본 추천 로직 (도시데이터 없을 때)
     */
    private List<MissionTemplate> getBasicRecommendations(LocalDateTime scheduledAt) {
        List<TimeOfDay> targetTimes = analyzeTimeOfDay(scheduledAt);
        List<LocationType> targetLocations = Arrays.asList(
            LocationType.INDOOR, LocationType.OUTDOOR, LocationType.ANY
        );

        List<MissionTemplate> candidates = missionRepository
                .findAllByTimeOfDayInAndLocationTypeIn(targetTimes, targetLocations);

        Collections.shuffle(candidates);

        return candidates.stream()
                .limit(4)
                .collect(Collectors.toList());
    }
}
