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

import java.time.LocalDate;
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
    private final ContentFilteringService contentFilteringService;

    /**
     * 시뮬레이션 실행 - 환경 변수를 통제하여 추천 결과 생성
     */
    @Transactional
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
                null // 시뮬레이션에서는 사용자 태그 미사용
        );

        debugLogs.add(String.format("🕒 시뮬레이션 시간: %s (%s, %d시)",
                context.getTargetDateTime(), context.getDayOfWeek(), context.getHour()));
        debugLogs.add(String.format("📍 위치: (%.4f, %.4f), 반경: %dkm",
                context.getLatitude(), context.getLongitude(), context.getSearchRadius()));
        debugLogs.add(String.format("☁️ 날씨: %s, 기온: %.1f°C, 미세먼지: %s",
                context.getWeather(), context.getTemperature(), context.getAirQuality()));
        debugLogs.add(String.format("👥 혼잡도: %s, MBTI: %s",
                context.getCongestion(), context.getUserMbti()));

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

        // 4. 장소 필터링 (dev-console: isPlaceRequired 와 무관하게 항상 조회)
        SimulationResponse.PlaceInfo placeInfo = null;
        List<Place> placeCandidates = new ArrayList<>();
        int totalPlaceCandidates = 0;
        int filteredPlaceCandidates = 0;

        boolean isPlaceRequired = selectedMission.getIsPlaceRequired() != null && selectedMission.getIsPlaceRequired();
        if (isPlaceRequired) {
            debugLogs.add("🏠 장소가 필요한 미션 - 장소 필터링 시작");
        } else {
            debugLogs.add("🌍 장소 불필요 미션이지만, dev-console에서 전체 장소도 함께 조회합니다");
        }

        placeCandidates = filterPlaces(context, selectedMission.getCategory(), debugLogs);
        totalPlaceCandidates = placeCandidates.size();

        if (!placeCandidates.isEmpty()) {
            Collections.shuffle(placeCandidates);
            Place selectedPlace = placeCandidates.get(0);
            filteredPlaceCandidates = placeCandidates.size();

            placeInfo = SimulationResponse.PlaceInfo.from(selectedPlace);

            debugLogs.add(String.format("✅ 선택된 장소: %s (카테고리: %s)",
                    selectedPlace.getName(), selectedPlace.getCategory()));
        } else {
            debugLogs.add("❌ 조건에 맞는 장소를 찾을 수 없습니다.");
        }

        // 5. 전체 미션 목록 변환
        List<MissionTemplateResponse> allMissions = missionCandidates.stream()
                .map(MissionTemplateResponse::from)
                .collect(Collectors.toList());

        // 6. 전체 장소 목록 변환 (허브 + 디테일 통합)
        List<SimulationResponse.PlaceInfo> allPlaces = placeCandidates.stream()
                .map(SimulationResponse.PlaceInfo::from)
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
            List<Place> places = placeRepository.findByCategoryWithDistance(
                    category,
                    context.getLatitude(),
                    context.getLongitude()
            );
            allPlaces.addAll(places);
        }

        debugLogs.add(String.format("📍 반경 %dkm 내 장소: %d개",
                context.getSearchRadius(), allPlaces.size()));

        // 3. Fallback - 카테고리 무관 검색
        if (allPlaces.isEmpty()) {
            debugLogs.add("⚠️ 카테고리 매칭 장소 없음 - 전체 장소에서 검색");
            allPlaces = placeRepository.findAllWithDistance(
                    context.getLatitude(),
                    context.getLongitude()
            );
            debugLogs.add(String.format("📍 Fallback - 전체 장소: %d개", allPlaces.size()));
        }

        // 4. ContentFilteringService를 사용한 키워드 필터링
        int beforeFilterSize = allPlaces.size();
        allPlaces = allPlaces.stream()
                .filter(p -> !contentFilteringService.shouldExclude(
                        p.getName(), p.getAddress(), p.getTags()))
                .collect(Collectors.toList());
        int excludedByKeyword = beforeFilterSize - allPlaces.size();
        if (excludedByKeyword > 0) {
            debugLogs.add(String.format("🚫 키워드 필터: %d개 → %d개 (제외 %d개)",
                    beforeFilterSize, allPlaces.size(), excludedByKeyword));
        }

        // 5. 공연/행사 기간 필터링 + 종료 공연 즉시 비활성화
        LocalDate simulationDate = context.getTargetDateTime().toLocalDate();
        LocalDate today = LocalDate.now();
        allPlaces = applyPerformanceFilter(allPlaces, simulationDate, today, debugLogs);

        // 6. 맑은 날 + 미세먼지 좋음 → 도서관 전체 배제 (야외 활동 유도)
        if (context.getWeather() == Weather.SUNNY && context.getAirQuality() == AirQuality.GOOD) {
            int beforeSize = allPlaces.size();
            allPlaces = allPlaces.stream()
                    .filter(p -> p.getDataSource() != DataSource.LIBRARY)
                    .collect(Collectors.toList());
            int excluded = beforeSize - allPlaces.size();
            if (excluded > 0) {
                debugLogs.add(String.format("📚 맑음+미세먼지좋음 → 도서관 %d개 배제 (%d개 → %d개)",
                        excluded, beforeSize, allPlaces.size()));
            }
        }

        // 7. 혼잡도 기반 필터링 (조용한 장소 선호)
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

        // 8. DataSource별 가중치 기반 선택 (도서관 추천 빈도 억제)
        allPlaces = applyDataSourceWeighting(allPlaces, context, debugLogs);

        return allPlaces;
    }

    /**
     * DataSource별 가중치 기반 장소 리밸런싱
     *
     * 도서관(LIBRARY)은 수적 우위(서울 200+개)로 인해 과다 추천되는 문제를 해결
     * - 기본 가중치: 도서관 0.3 (30%), 공원 0.8 (80%), 기타 1.0 (100%)
     * - 혼잡도 HIGH + MBTI I성향 → 도서관 가중치 보너스 (+0.3)
     * - 혼잡도 LOW + MBTI E성향 → 도서관 가중치 추가 감소 (-0.1)
     *
     * 가중치를 "선택 확률"로 변환하여 가중치가 높은 장소가 리스트 앞쪽에 오도록 정렬 후
     * 확률 기반으로 장소를 선별합니다.
     */
    private List<Place> applyDataSourceWeighting(
            List<Place> places,
            EnvironmentContext context,
            List<String> debugLogs) {

        if (places.isEmpty()) return places;

        // 1. DataSource별 기본 가중치 설정
        Map<DataSource, Double> weights = new HashMap<>();
        weights.put(DataSource.LIBRARY, 0.3);         // 도서관: 기본 30%
        weights.put(DataSource.SEOUL_PARK, 0.8);       // 공원: 기본 80%
        weights.put(DataSource.KOPIS, 1.0);            // 공연: 100%
        weights.put(DataSource.SEOUL_CULTURE, 1.0);    // 문화행사: 100%
        weights.put(DataSource.SEOUL_RESERVATION, 1.0);// 공공예약: 100%
        weights.put(DataSource.SEOUL_RESTAURANT, 1.0); // 음식점: 100%
        weights.put(DataSource.MANUAL, 1.0);           // 수동: 100%

        // 2. 혼잡도 + MBTI(I/E) 기반 도서관 가중치 조정
        double libraryWeight = weights.get(DataSource.LIBRARY);
        String mbti = context.getUserMbti();
        boolean isIntrovert = mbti != null && mbti.toUpperCase().startsWith("I");
        boolean isExtrovert = mbti != null && mbti.toUpperCase().startsWith("E");
        Congestion congestion = context.getCongestion();

        StringBuilder weightLog = new StringBuilder();
        weightLog.append(String.format("📊 도서관 기본 가중치: %.1f", libraryWeight));

        // 혼잡도 HIGH + I성향 → 조용한 곳 선호 → 도서관 가중치 보너스
        if (congestion == Congestion.HIGH && isIntrovert) {
            libraryWeight += 0.3;
            weightLog.append(String.format(" → +0.3 (혼잡도 HIGH + I성향) = %.1f", libraryWeight));
        }
        // 혼잡도 MEDIUM + I성향 → 약간의 보너스
        else if (congestion == Congestion.MEDIUM && isIntrovert) {
            libraryWeight += 0.15;
            weightLog.append(String.format(" → +0.15 (혼잡도 MEDIUM + I성향) = %.1f", libraryWeight));
        }
        // 혼잡도 LOW + E성향 → 활동적인 장소 선호 → 도서관 추가 감소
        else if (congestion == Congestion.LOW && isExtrovert) {
            libraryWeight -= 0.1;
            libraryWeight = Math.max(0.1, libraryWeight); // 최소 10%
            weightLog.append(String.format(" → -0.1 (혼잡도 LOW + E성향) = %.1f", libraryWeight));
        }

        weights.put(DataSource.LIBRARY, libraryWeight);
        debugLogs.add(weightLog.toString());

        // 3. DataSource별 장소 그룹핑
        Map<DataSource, List<Place>> groupedBySource = places.stream()
                .collect(Collectors.groupingBy(
                        p -> p.getDataSource() != null ? p.getDataSource() : DataSource.MANUAL));

        // 4. 가중치 기반 리밸런싱: 각 그룹에서 가중치 비율만큼 장소 선별
        List<Place> rebalanced = new ArrayList<>();
        int totalSize = places.size();

        for (Map.Entry<DataSource, List<Place>> entry : groupedBySource.entrySet()) {
            DataSource source = entry.getKey();
            List<Place> sourcePlaces = new ArrayList<>(entry.getValue());
            double weight = weights.getOrDefault(source, 1.0);

            // 가중치 적용된 최대 개수 = 원본 개수 * 가중치 (최소 1개)
            int maxCount = Math.max(1, (int) Math.round(sourcePlaces.size() * weight));

            // 셔플 후 가중치만큼만 선별
            Collections.shuffle(sourcePlaces);
            List<Place> selected = sourcePlaces.subList(0, Math.min(maxCount, sourcePlaces.size()));
            rebalanced.addAll(selected);

            if (selected.size() < sourcePlaces.size()) {
                debugLogs.add(String.format("  ⚖️ %s: %d개 → %d개 (가중치 %.1f)",
                        source, sourcePlaces.size(), selected.size(), weight));
            }
        }

        if (rebalanced.size() != places.size()) {
            debugLogs.add(String.format("📊 가중치 리밸런싱: %d개 → %d개", places.size(), rebalanced.size()));
        }

        // 최종 셔플
        Collections.shuffle(rebalanced);
        return rebalanced;
    }

    /**
     * 공연/행사 기간 필터링
     * - performanceDetail이 있는 장소: 시뮬레이션 날짜가 공연 기간(startDate~endDate) 내인 것만 통과
     * - endDate < 오늘: 공연이 이미 종료 → isActive=false로 즉시 비활성화
     * - performanceDetail이 없는 장소(음식점, 카페 등): 필터 없이 통과
     */
    private List<Place> applyPerformanceFilter(
            List<Place> places,
            LocalDate simulationDate,
            LocalDate today,
            List<String> debugLogs) {

        int beforeSize = places.size();
        int deactivatedCount = 0;
        int expiredFilteredCount = 0;
        int notYetStartedCount = 0;

        List<Place> filtered = new ArrayList<>();

        for (Place place : places) {
            // 공연 detail이 없는 장소 (음식점, 카페, 공원 등) → 그대로 통과
            if (place.getPerformanceDetail() == null) {
                filtered.add(place);
                continue;
            }

            LocalDate startDate = place.getPerformanceDetail().getStartDate();
            LocalDate endDate = place.getPerformanceDetail().getEndDate();

            // endDate가 오늘 이전 → 공연 완전 종료 → 즉시 비활성화
            if (endDate != null && endDate.isBefore(today)) {
                place.deactivate();
                deactivatedCount++;
                debugLogs.add(String.format("🚫 [비활성화] %s - 공연종료(%s), isActive=false 처리",
                        place.getName(), endDate));
                continue; // 필터에서 제외
            }

            // 시뮬레이션 날짜 기준 공연 기간 체크
            boolean afterStart = (startDate == null || !simulationDate.isBefore(startDate));
            boolean beforeEnd = (endDate == null || !simulationDate.isAfter(endDate));

            if (afterStart && beforeEnd) {
                // 시뮬레이션 날짜에 공연중 → 통과
                filtered.add(place);
            } else if (!afterStart) {
                // 아직 시작 전
                notYetStartedCount++;
            } else {
                // 시뮬레이션 날짜 기준 종료 (실제 오늘과 별개)
                expiredFilteredCount++;
            }
        }

        int totalExcluded = beforeSize - filtered.size();
        if (totalExcluded > 0) {
            debugLogs.add(String.format("🎭 공연 기간 필터: %d개 → %d개 (제외 %d개: 비활성화 %d, 기간외 %d, 미시작 %d)",
                    beforeSize, filtered.size(), totalExcluded,
                    deactivatedCount, expiredFilteredCount, notYetStartedCount));
        }
        if (deactivatedCount > 0) {
            debugLogs.add(String.format("⚡ 종료 공연 %d건 즉시 비활성화 완료 (isActive=false)", deactivatedCount));
        }

        return filtered;
    }

    /**
     * 카테고리 매핑 (AppointmentService와 동일한 로직)
     */
    private List<MissionCategory> getCategoryMapping(MissionCategory missionCategory) {
        List<MissionCategory> mapping = new ArrayList<>();

        switch (missionCategory) {
            case ACTIVITY:
                mapping.add(MissionCategory.ACTIVITY);
                mapping.add(MissionCategory.CULTURE);
                break;
            case CULTURE:
                mapping.add(MissionCategory.CULTURE);
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
