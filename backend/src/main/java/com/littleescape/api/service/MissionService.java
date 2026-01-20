package com.littleescape.api.service;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.SeoulCityPlace;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.TimeOfDay;
import com.littleescape.api.dto.response.DailyMissionResponse;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.repository.SeoulCityPlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MissionService {

    private final MissionTemplateRepository missionTemplateRepository;
    private final SeoulCityPlaceRepository seoulCityPlaceRepository;

    // 혼잡도 필터링 기준: 보통(2) 이하만 추천
    private static final int MAX_ACCEPTABLE_CONGESTION_LEVEL = 2;
    // 미션-장소 간 매칭 거리 허용 범위 (km)
    private static final double PLACE_MATCHING_RADIUS_KM = 0.5;

    /**
     * 주어진 약속 시간에 맞는 미션 추천
     *
     * @param scheduledAt 약속 예정 시간
     * @return 추천 미션 리스트 (최대 4개)
     */
    public List<MissionTemplate> getRecommendations(
        @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")LocalDateTime scheduledAt
    ) {
        // 1. 시간대 분석
        List<TimeOfDay> targetTimes = analyzeTimeOfDay(scheduledAt);

        // 2. 날씨/장소 분석 (임시: 날씨 API 연동 전)
        List<LocationType> targetLocations = analyzeLocation();

        log.info("=== 미션 추천 로직 실행 === 요청 시간: {} 판단된 시간대: {} 장소 필터: {}",
                scheduledAt, targetTimes.get(0), targetLocations);

        // 3. 조건에 맞는 미션 조회
        List<MissionTemplate> candidates = missionTemplateRepository
                .findAllByTimeOfDayInAndLocationTypeIn(targetTimes, targetLocations);

        // 4. 랜덤 섞기
        Collections.shuffle(candidates);

        // 5. 최대 4개 선정
        return candidates.stream()
                .limit(4)
                .collect(Collectors.toList());
    }

    /**
     * 위치 기반 미션 추천 (거리 필터링 + 혼잡도 필터링 포함)
     *
     * @param scheduledAt 약속 예정 시간
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km)
     * @return 추천 미션 리스트 (최대 4개, 거리순 정렬, 혼잡한 장소 제외)
     */
    public List<MissionTemplate> getRecommendationsWithLocation(
            LocalDateTime scheduledAt,
            Double latitude,
            Double longitude,
            Integer radiusKm
    ) {
        // 위치 정보가 없으면 기존 로직 사용
        if (latitude == null || longitude == null) {
            return getRecommendations(scheduledAt);
        }

        // 1. 시간대 분석
        List<TimeOfDay> targetTimes = analyzeTimeOfDay(scheduledAt);

        // 2. 날씨/장소 분석
        List<LocationType> targetLocations = analyzeLocation();

        log.info("=== 위치 기반 미션 추천 === 시간: {} 위치: ({}, {}) 반경: {}km",
                scheduledAt, latitude, longitude, radiusKm);

        // 3. 시간대 + 위치 타입 + 거리 기반 조회
        List<String> timeStrings = targetTimes.stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        List<String> locationStrings = targetLocations.stream()
                .map(Enum::name)
                .collect(Collectors.toList());

        List<MissionTemplate> candidates = missionTemplateRepository
                .findByTimeOfDayAndLocationTypeWithinRadius(
                        latitude, longitude, radiusKm,
                        timeStrings, locationStrings
                );

        log.info("초기 후보 미션 {}개 조회됨", candidates.size());

        // 4. 혼잡도 필터링 적용
        List<MissionTemplate> filteredCandidates = filterByCongestion(candidates, latitude, longitude);

        log.info("혼잡도 필터링 후 {}개 미션 남음", filteredCandidates.size());

        // 5. 거리순으로 이미 정렬되어 있으므로 섞지 않음
        // 6. 최대 4개 선정
        return filteredCandidates.stream()
                .limit(4)
                .collect(Collectors.toList());
    }

    /**
     * 혼잡도 기반 미션 필터링
     *
     * 필터링 규칙:
     * 1. 미션 위치 주변 0.5km 내 SeoulCityPlace 데이터가 있는지 확인
     * 2. 있다면 → 혼잡도 2(보통) 이하인 경우만 포함
     * 3. 없다면 → 그대로 포함 (카카오맵 기반 장소는 필터링 제외)
     *
     * @param missions 필터링 대상 미션 목록
     * @param userLatitude 사용자 위도
     * @param userLongitude 사용자 경도
     * @return 혼잡도 필터링된 미션 목록
     */
    private List<MissionTemplate> filterByCongestion(
            List<MissionTemplate> missions,
            Double userLatitude,
            Double userLongitude
    ) {
        // 근처의 서울시 도시데이터 조회 (보통 이하 혼잡도만)
        List<SeoulCityPlace> lowCongestionPlaces = seoulCityPlaceRepository
                .findByCongestionLevelLessThanEqual(MAX_ACCEPTABLE_CONGESTION_LEVEL);

        log.info("서울시 도시데이터: 혼잡도 {}(보통) 이하 장소 {}개",
                MAX_ACCEPTABLE_CONGESTION_LEVEL, lowCongestionPlaces.size());

        // 모든 서울시 장소 (혼잡도 정보 있는 곳)
        List<SeoulCityPlace> allSeoulPlaces = seoulCityPlaceRepository
                .findByIsValidTrue();

        return missions.stream()
                .filter(mission -> {
                    // 미션 위치 정보가 없으면 포함 (안전하게 처리)
                    if (mission.getLatitude() == null || mission.getLongitude() == null) {
                        log.debug("미션 '{}': 위치 정보 없음 → 포함", mission.getTitle());
                        return true;
                    }

                    // 미션 근처에 서울시 도시데이터가 있는지 확인
                    SeoulCityPlace nearestPlace = findNearestPlace(
                            mission.getLatitude(),
                            mission.getLongitude(),
                            allSeoulPlaces
                    );

                    // 근처에 서울시 데이터가 없으면 → 카카오맵 기반 장소이므로 포함
                    if (nearestPlace == null ||
                        calculateDistance(
                            mission.getLatitude(), mission.getLongitude(),
                            nearestPlace.getLatitude(), nearestPlace.getLongitude()
                        ) > PLACE_MATCHING_RADIUS_KM) {
                        log.debug("미션 '{}': 서울시 데이터 없음 (카카오맵 기반) → 포함", mission.getTitle());
                        return true;
                    }

                    // 근처에 서울시 데이터가 있으면 → 혼잡도 확인
                    boolean isInLowCongestion = lowCongestionPlaces.stream()
                            .anyMatch(place -> place.getId().equals(nearestPlace.getId()));

                    if (isInLowCongestion) {
                        log.debug("미션 '{}': 근처 장소 '{}' 혼잡도 {} → 포함",
                                mission.getTitle(), nearestPlace.getPlaceName(),
                                nearestPlace.getCongestionLevel());
                        return true;
                    } else {
                        log.debug("미션 '{}': 근처 장소 '{}' 혼잡도 {} → 제외 (혼잡함)",
                                mission.getTitle(), nearestPlace.getPlaceName(),
                                nearestPlace.getCongestionLevel());
                        return false;
                    }
                })
                .collect(Collectors.toList());
    }

    /**
     * 가장 가까운 서울시 장소 찾기
     *
     * @param latitude 기준 위도
     * @param longitude 기준 경도
     * @param places 검색 대상 장소 목록
     * @return 가장 가까운 장소 (없으면 null)
     */
    private SeoulCityPlace findNearestPlace(
            Double latitude,
            Double longitude,
            List<SeoulCityPlace> places
    ) {
        return places.stream()
                .filter(place -> place.getLatitude() != null && place.getLongitude() != null)
                .min((p1, p2) -> {
                    double dist1 = calculateDistance(latitude, longitude, p1.getLatitude(), p1.getLongitude());
                    double dist2 = calculateDistance(latitude, longitude, p2.getLatitude(), p2.getLongitude());
                    return Double.compare(dist1, dist2);
                })
                .orElse(null);
    }

    /**
     * 두 지점 간 거리 계산 (Haversine 공식)
     *
     * @param lat1 지점1 위도
     * @param lon1 지점1 경도
     * @param lat2 지점2 위도
     * @param lon2 지점2 경도
     * @return 거리 (km)
     */
    private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        final int EARTH_RADIUS_KM = 6371;

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    /**
     * 시간대 분석 로직
     *
     * @param scheduledAt 약속 예정 시간
     * @return 해당 시간대 + ANY를 포함한 리스트
     */
    private List<TimeOfDay> analyzeTimeOfDay(LocalDateTime scheduledAt) {
        int hour = scheduledAt.getHour();
        List<TimeOfDay> times = new ArrayList<>();

        // 시간대별 분류
        if (hour >= 6 && hour < 12) {
            times.add(TimeOfDay.MORNING);
        } else if (hour >= 12 && hour < 18) {
            times.add(TimeOfDay.AFTERNOON);
        } else {
            // 18~24시 또는 0~6시는 NIGHT
            times.add(TimeOfDay.NIGHT);
        }

        // ANY(무관)는 항상 포함
        times.add(TimeOfDay.ANY);

        return times;
    }

    /**
     * 날씨/장소 분석 로직
     * TODO: 날씨 API 연동 후 실제 날씨 데이터 활용
     *
     * @return 추천 가능한 장소 타입 리스트
     */
    private List<LocationType> analyzeLocation() {
        // 임시: 날씨 API 연동 전이므로 항상 맑음으로 가정
        boolean isRaining = false;

        List<LocationType> locations = new ArrayList<>();

        if (isRaining) {
            // 비/눈: 실내와 무관만 포함
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.ANY);
        } else {
            // 맑음: 모든 장소 포함
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.OUTDOOR);
            locations.add(LocationType.ANY);
        }

        return locations;
    }

    /**
     * 일일 미션 추천 - 사용자에게 단일 미션 반환
     *
     * TODO: 향후 개선 사항
     * 1. 사용자 프로필 분석 (선호도, 난이도, 과거 완료 이력)
     * 2. 날씨 API 연동 (비올 때는 실내 미션 우선)
     * 3. 시간대별 필터링 (오전/오후/저녁)
     * 4. 위치 기반 필터링 (사용자 위치 근처)
     *
     * @param userId 사용자 ID (현재는 미사용, 추후 확장용)
     * @param scheduledAt 약속 예정 시간 (선택적)
     * @return 일일 추천 미션
     */
    public DailyMissionResponse getDailyMission(Long userId, LocalDateTime scheduledAt) {
        log.info("=== 일일 미션 추천 시작 === userId: {}, scheduledAt: {}", userId, scheduledAt);

        // 약속 시간이 없으면 현재 시간 사용
        LocalDateTime targetTime = (scheduledAt != null) ? scheduledAt : LocalDateTime.now();

        // TODO: 시간대/날씨 기반 필터링 로직 (향후 구현)
        // List<TimeOfDay> targetTimes = analyzeTimeOfDay(targetTime);
        // List<LocationType> targetLocations = analyzeLocation();

        // 현재는 모든 미션 중 랜덤 선택
        List<MissionTemplate> allMissions = missionTemplateRepository.findAll();

        if (allMissions.isEmpty()) {
            throw new IllegalStateException("사용 가능한 미션이 없습니다.");
        }

        // 랜덤 선택
        Random random = new Random();
        MissionTemplate selectedMission = allMissions.get(random.nextInt(allMissions.size()));

        log.info("선택된 미션: {} (ID: {})", selectedMission.getTitle(), selectedMission.getId());

        // DTO 변환
        return convertToResponse(selectedMission, targetTime);
    }

    /**
     * Plan B (대안 미션) 추천 - 원래 미션이 부담스러울 때
     *
     * @param originalMissionId 원래 미션 ID
     * @return Plan B 미션 정보를 포함한 응답
     */
    public DailyMissionResponse getEscapeMission(Long originalMissionId) {
        log.info("=== Plan B 미션 요청 === originalMissionId: {}", originalMissionId);

        // 원래 미션 조회 (검증용)
        missionTemplateRepository.findById(originalMissionId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 미션입니다: " + originalMissionId));

        // Plan B: INDOOR 또는 RELAX 카테고리에서 랜덤 선택
        List<MissionTemplate> planBCandidates = missionTemplateRepository.findAll().stream()
                .filter(m -> m.getCategory() == MissionCategory.RELAX ||
                             m.getLocationType() == LocationType.INDOOR)
                .collect(Collectors.toList());

        if (planBCandidates.isEmpty()) {
            throw new IllegalStateException("Plan B로 추천할 수 있는 미션이 없습니다.");
        }

        // 랜덤 선택
        Random random = new Random();
        MissionTemplate planBMission = planBCandidates.get(random.nextInt(planBCandidates.size()));

        log.info("Plan B 선택: {} (ID: {})", planBMission.getTitle(), planBMission.getId());

        // 츤데레 톤의 추천 이유 생성
        String tsundereReason = generateTsundereReason(planBMission.getCategory());

        // DTO 변환
        DailyMissionResponse response = convertToResponse(planBMission, LocalDateTime.now());

        // Plan B 정보 추가
        DailyMissionResponse.PlanB planBInfo = DailyMissionResponse.PlanB.builder()
                .title(planBMission.getTitle())
                .description(planBMission.getDescription())
                .placeName(planBMission.getAddress())
                .reason(tsundereReason)
                .build();

        return DailyMissionResponse.builder()
                .id(response.getId())
                .title(response.getTitle())
                .description(response.getDescription())
                .location(response.getLocation())
                .timeToMeet(response.getTimeToMeet())
                .isCompleted(response.getIsCompleted())
                .category(response.getCategory())
                .imageUrl(response.getImageUrl())
                .planB(planBInfo)
                .build();
    }

    /**
     * MissionTemplate을 DailyMissionResponse로 변환
     */
    private DailyMissionResponse convertToResponse(MissionTemplate mission, LocalDateTime scheduledAt) {
        // 시간 포맷팅 (예: "오후 3:00")
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("a h:mm");
        String timeToMeet = scheduledAt.format(formatter);

        // 장소 정보 생성
        DailyMissionResponse.LocationInfo location = DailyMissionResponse.LocationInfo.builder()
                .name(mission.getAddress())
                .address(mission.getAddress())
                .latitude(mission.getLatitude())
                .longitude(mission.getLongitude())
                .build();

        return DailyMissionResponse.builder()
                .id(mission.getId())
                .title(mission.getTitle())
                .description(mission.getDescription())
                .location(location)
                .timeToMeet(timeToMeet)
                .isCompleted(false)
                .category(mission.getCategory())
                .imageUrl(mission.getImageUrl())
                .planB(null) // 초기에는 Plan B 없음
                .build();
    }

    /**
     * 츤데레 톤의 Plan B 추천 이유 생성
     */
    private String generateTsundereReason(MissionCategory category) {
        List<String> reasons = new ArrayList<>();

        switch (category) {
            case RELAX:
                reasons.add("사람 많은 곳이 부담스러울 수도 있잖아. 그럴 줄 알고 준비했어.");
                reasons.add("무리하지 마. 오늘은 편하게 쉬는 것도 나쁘지 않아.");
                reasons.add("별로 안 피곤해 보이긴 하는데... 그래도 쉬는 게 나을 것 같아서.");
                break;
            case CULTURE:
                reasons.add("문화생활도 나쁘지 않지. 뭐, 네가 원한다면 말이야.");
                reasons.add("조용한 곳이 더 좋을 수도 있으니까. 억지로 권하는 건 아니야.");
                break;
            default:
                reasons.add("이쪽이 더 편할 것 같아서. 뭐, 네 마음대로 해.");
                reasons.add("부담 갖지 마. 천천히 해도 괜찮아.");
        }

        Random random = new Random();
        return reasons.get(random.nextInt(reasons.size()));
    }
}
