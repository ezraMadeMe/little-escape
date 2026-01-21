package com.littleescape.api.service;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.type.*;
import com.littleescape.api.dto.MissionTemplateResponse;
import com.littleescape.api.dto.simulation.SimulationRequest;
import com.littleescape.api.dto.simulation.SimulationResponse;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.repository.PlaceRepository;
import com.littleescape.api.service.simulation.EnvironmentContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.*;
import java.util.stream.Collectors;

/**
 * God Mode Simulation Service
 * 환경 변수를 통제하여 추천 로직을 테스트하는 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationService {

    private final MissionTemplateRepository missionTemplateRepository;
    private final PlaceRepository placeRepository;

    // 1인 가구 타겟에 맞지 않는 키워드
    private static final String[] BAD_KEYWORDS = {
            "어린이", "유아", "강좌", "교실", "모집", "시니어", "동호회"
    };

    /**
     * 시뮬레이션 실행 - 환경 변수를 통제하여 추천 결과 생성
     */
    @Transactional(readOnly = true)
    public SimulationResponse runSimulation(SimulationRequest request) {
        log.info("=== God Mode Simulation 시작 ===");

        // 디버그 로그 수집
        List<String> debugLogs = new ArrayList<>();

        // 1. 환경 컨텍스트 생성
        EnvironmentContext context = EnvironmentContext.fromSimulation(
                request.targetDateTime(),
                request.latitude(),
                request.longitude(),
                request.searchRadius(),
                request.weather(),
                request.temperature(),
                request.airQuality(),
                request.congestion(),
                request.userMbti(),
                request.soloLevel(),
                null // 시뮬레이션에서는 사용자 태그 미사용
        );

        debugLogs.add(String.format("🕒 시뮬레이션 시간: %s (%s, %d시)",
                context.getTargetDateTime(), context.getDayOfWeek(), context.getHour()));
        debugLogs.add(String.format("📍 위치: (%.4f, %.4f), 반경: %dkm",
                context.getLatitude(), context.getLongitude(), context.getSearchRadius()));
        debugLogs.add(String.format("☁️ 날씨: %s, 기온: %.1f°C, 미세먼지: %s",
                context.getWeather(), context.getTemperature(), context.getAirQuality()));
        debugLogs.add(String.format("👥 혼잡도: %s, MBTI: %s, 솔로레벨: %d",
                context.getCongestion(), context.getUserMbti(), context.getSoloLevel()));

        // 2. 미션 필터링
        List<MissionTemplate> missionCandidates = filterMissions(context, request.forcedCategory(), debugLogs);

        if (missionCandidates.isEmpty()) {
            debugLogs.add("❌ 조건에 맞는 미션을 찾을 수 없습니다.");
            return new SimulationResponse(null, null, debugLogs, 0, 0, 0, 0, List.of(), List.of());
        }

        // 3. 랜덤으로 미션 선택
        Collections.shuffle(missionCandidates);
        MissionTemplate selectedMission = missionCandidates.get(0);

        debugLogs.add(String.format("✅ 선택된 미션: %s (카테고리: %s, 난이도: %s)",
                selectedMission.getTitle(), selectedMission.getCategory(), selectedMission.getDifficultyLevel()));

        // 4. 장소 필터링 (장소가 필요한 미션인 경우)
        SimulationResponse.PlaceInfo placeInfo = null;
        List<Place> placeCandidates = new ArrayList<>();
        int totalPlaceCandidates = 0;
        int filteredPlaceCandidates = 0;

        if (selectedMission.getIsPlaceRequired() != null && selectedMission.getIsPlaceRequired()) {
            debugLogs.add("🏠 장소가 필요한 미션 - 장소 필터링 시작");

            placeCandidates = filterPlaces(context, selectedMission.getCategory(), debugLogs);
            totalPlaceCandidates = placeCandidates.size();

            if (!placeCandidates.isEmpty()) {
                Collections.shuffle(placeCandidates);
                Place selectedPlace = placeCandidates.get(0);
                filteredPlaceCandidates = placeCandidates.size();

                placeInfo = new SimulationResponse.PlaceInfo(
                        selectedPlace.getId(),
                        selectedPlace.getName(),
                        selectedPlace.getAddress(),
                        selectedPlace.getCategory().name(),
                        selectedPlace.getLatitude(),
                        selectedPlace.getLongitude(),
                        selectedPlace.getImageUrl(),
                        selectedPlace.getTags()
                );

                debugLogs.add(String.format("✅ 선택된 장소: %s (카테고리: %s)",
                        selectedPlace.getName(), selectedPlace.getCategory()));
            } else {
                debugLogs.add("❌ 조건에 맞는 장소를 찾을 수 없습니다.");
            }
        } else {
            debugLogs.add("🌍 장소가 필요 없는 미션 - 어디서든 수행 가능");
        }

        // 5. 전체 미션 목록 변환
        List<MissionTemplateResponse> allMissions = missionCandidates.stream()
                .map(MissionTemplateResponse::from)
                .collect(Collectors.toList());

        // 6. 전체 장소 목록 변환
        List<SimulationResponse.PlaceInfo> allPlaces = placeCandidates.stream()
                .map(place -> new SimulationResponse.PlaceInfo(
                        place.getId(),
                        place.getName(),
                        place.getAddress(),
                        place.getCategory().name(),
                        place.getLatitude(),
                        place.getLongitude(),
                        place.getImageUrl(),
                        place.getTags()
                ))
                .collect(Collectors.toList());

        // 7. 응답 생성
        MissionTemplateResponse missionResponse = MissionTemplateResponse.from(selectedMission);

        log.info("=== God Mode Simulation 완료 ===");
        return new SimulationResponse(
                missionResponse,
                placeInfo,
                debugLogs,
                missionCandidates.size(),
                missionCandidates.size(),
                totalPlaceCandidates,
                filteredPlaceCandidates,
                allMissions,
                allPlaces
        );
    }

    /**
     * 미션 필터링 로직
     */
    private List<MissionTemplate> filterMissions(
            EnvironmentContext context,
            MissionCategory forcedCategory,
            List<String> debugLogs) {

        // 1. 시간대 분석
        List<TimeOfDay> targetTimes = analyzeTimeOfDay(context, debugLogs);

        // 2. 장소 타입 분석 (날씨 기반)
        List<LocationType> targetLocations = analyzeLocation(context, debugLogs);

        // 3. 카테고리 강제 지정 여부
        if (forcedCategory != null) {
            debugLogs.add(String.format("🎯 카테고리 강제 지정: %s", forcedCategory));
        }

        // 4. 미션 후보 조회
        List<MissionTemplate> candidates;
        if (forcedCategory != null) {
            // 카테고리가 강제된 경우, 전체 미션에서 필터링
            candidates = missionTemplateRepository.findAll().stream()
                    .filter(m -> m.getCategory() == forcedCategory)
                    .filter(m -> targetTimes.contains(m.getTimeOfDay()))
                    .filter(m -> targetLocations.contains(m.getLocationType()))
                    .collect(Collectors.toList());
        } else {
            // 일반 경우
            candidates = missionTemplateRepository.findAllByTimeOfDayInAndLocationTypeIn(
                    targetTimes, targetLocations);
        }

        debugLogs.add(String.format("📋 조건에 맞는 미션 후보: %d개", candidates.size()));

        // 5. 시간대별 추가 필터링
        candidates = applyTimeFilters(candidates, context, debugLogs);

        // 6. 난이도 필터링 (솔로 레벨 기반)
        candidates = applyDifficultyFilters(candidates, context, debugLogs);

        debugLogs.add(String.format("✅ 필터링 후 미션 후보: %d개", candidates.size()));

        return candidates;
    }

    /**
     * 시간대 분석
     */
    private List<TimeOfDay> analyzeTimeOfDay(EnvironmentContext context, List<String> debugLogs) {
        int hour = context.getHour();
        List<TimeOfDay> times = new ArrayList<>();

        if (hour >= 6 && hour < 12) {
            times.add(TimeOfDay.MORNING);
            debugLogs.add("⏰ 시간대: 아침 (MORNING)");
        } else if (hour >= 12 && hour < 18) {
            times.add(TimeOfDay.AFTERNOON);
            debugLogs.add("⏰ 시간대: 오후 (AFTERNOON)");
        } else {
            times.add(TimeOfDay.NIGHT);
            debugLogs.add("⏰ 시간대: 밤 (NIGHT)");
        }

        times.add(TimeOfDay.ANY);
        return times;
    }

    /**
     * 장소 타입 분석 (날씨 기반)
     */
    private List<LocationType> analyzeLocation(EnvironmentContext context, List<String> debugLogs) {
        List<LocationType> locations = new ArrayList<>();

        if (context.isOutdoorRestricted()) {
            // 야외 활동 제한 (비/눈/극한 기온/최악의 미세먼지)
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.ANY);
            debugLogs.add("🌧️ 야외 활동 제한 - 실내 장소만 추천 (비/눈/극한기온/미세먼지)");
        } else if (context.isIndoorPreferred()) {
            // 실내 선호 (미세먼지 나쁨)
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.ANY);
            debugLogs.add("🏠 실내 장소 선호 - 미세먼지 나쁨");
        } else {
            // 모든 장소 가능
            locations.add(LocationType.INDOOR);
            locations.add(LocationType.OUTDOOR);
            locations.add(LocationType.ANY);
            debugLogs.add("☀️ 모든 장소 타입 가능");
        }

        return locations;
    }

    /**
     * 시간대별 추가 필터링
     */
    private List<MissionTemplate> applyTimeFilters(
            List<MissionTemplate> candidates,
            EnvironmentContext context,
            List<String> debugLogs) {

        List<MissionTemplate> filtered = new ArrayList<>(candidates);

        // 월요일: 도서관 제외 (CULTURE 카테고리 중 도서관 관련)
        if (context.isMonday()) {
            int beforeSize = filtered.size();
            filtered = filtered.stream()
                    .filter(m -> !(m.getCategory() == MissionCategory.CULTURE &&
                            (m.getTitle().contains("도서관") || m.getDescription().contains("도서관"))))
                    .collect(Collectors.toList());

            if (beforeSize > filtered.size()) {
                debugLogs.add(String.format("📅 월요일 - 도서관 미션 제외 (%d개 제외됨)",
                        beforeSize - filtered.size()));
            }
        }

        // 밤 10시 이후: 전시/공연 제외
        if (context.isLateNight()) {
            int beforeSize = filtered.size();
            filtered = filtered.stream()
                    .filter(m -> !(m.getCategory() == MissionCategory.CULTURE &&
                            (m.getTitle().contains("전시") || m.getTitle().contains("공연"))))
                    .collect(Collectors.toList());

            if (beforeSize > filtered.size()) {
                debugLogs.add(String.format("🌙 밤 10시 이후 - 전시/공연 미션 제외 (%d개 제외됨)",
                        beforeSize - filtered.size()));
            }
        }

        return filtered;
    }

    /**
     * 난이도 필터링 (솔로 레벨 기반)
     */
    private List<MissionTemplate> applyDifficultyFilters(
            List<MissionTemplate> candidates,
            EnvironmentContext context,
            List<String> debugLogs) {

        Integer soloLevel = context.getSoloLevel();

        if (soloLevel == null || soloLevel >= 3) {
            debugLogs.add(String.format("🎓 솔로 레벨 %d - 모든 난이도 허용", soloLevel));
            return candidates;
        }

        // 솔로 레벨이 낮으면 난이도 높은 미션(혼밥/혼술) 제외
        int beforeSize = candidates.size();
        List<MissionTemplate> filtered = candidates.stream()
                .filter(m -> !m.getDifficultyLevel().equals("HARD"))
                .collect(Collectors.toList());

        if (beforeSize > filtered.size()) {
            debugLogs.add(String.format("🎓 솔로 레벨 %d - 난이도 높은 미션 제외 (%d개 제외됨)",
                    soloLevel, beforeSize - filtered.size()));
        }

        return filtered;
    }

    /**
     * 장소 필터링 로직
     */
    private List<Place> filterPlaces(
            EnvironmentContext context,
            MissionCategory missionCategory,
            List<String> debugLogs) {

        // 1. 카테고리 매핑
        List<MissionCategory> targetCategories = getCategoryMapping(missionCategory);
        debugLogs.add(String.format("🗂️ 매칭 카테고리: %s", targetCategories));

        // 2. 카테고리별 장소 검색
        List<Place> allPlaces = new ArrayList<>();
        for (MissionCategory category : targetCategories) {
            List<Place> places = placeRepository.findByCategoryFilteredWithDistance(
                    category,
                    context.getLatitude(),
                    context.getLongitude(),
                    BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                    BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
            );
            allPlaces.addAll(places);
        }

        debugLogs.add(String.format("📍 반경 %dkm 내 필터링된 장소: %d개",
                context.getSearchRadius(), allPlaces.size()));

        // 3. Fallback - 카테고리 무관 검색
        if (allPlaces.isEmpty()) {
            debugLogs.add("⚠️ 카테고리 매칭 장소 없음 - 전체 장소에서 검색");
            allPlaces = placeRepository.findAllFilteredWithDistance(
                    context.getLatitude(),
                    context.getLongitude(),
                    BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                    BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
            );
            debugLogs.add(String.format("📍 Fallback - 전체 필터링된 장소: %d개", allPlaces.size()));
        }

        // 4. 혼잡도 기반 필터링 (조용한 장소 선호)
        if (context.prefersQuietPlace()) {
            int beforeSize = allPlaces.size();
            List<Place> quietPlaces = allPlaces.stream()
                    .filter(p -> p.getTags() != null && p.getTags().contains("QUIET"))
                    .collect(Collectors.toList());

            if (!quietPlaces.isEmpty()) {
                allPlaces = quietPlaces;
                debugLogs.add(String.format("🤫 혼잡도 높음 - 조용한 장소 우선 (%d개 → %d개)",
                        beforeSize, allPlaces.size()));
            }
        }

        return allPlaces;
    }

    /**
     * 카테고리 매핑 (AppointmentService와 동일한 로직)
     */
    private List<MissionCategory> getCategoryMapping(MissionCategory missionCategory) {
        List<MissionCategory> mapping = new ArrayList<>();

        switch (missionCategory) {
            case ACTIVITY:
                mapping.add(MissionCategory.ACTIVITY);
                mapping.add(MissionCategory.RELAX);
                mapping.add(MissionCategory.CULTURE);
                break;
            case CULTURE:
                mapping.add(MissionCategory.CULTURE);
                mapping.add(MissionCategory.RELAX);
                break;
            case RELAX:
                mapping.add(MissionCategory.RELAX);
                mapping.add(MissionCategory.CULTURE);
                break;
            case FOOD:
                mapping.add(MissionCategory.FOOD);
                mapping.add(MissionCategory.RELAX);
                break;
            default:
                mapping.add(missionCategory);
                break;
        }

        return mapping;
    }
}
