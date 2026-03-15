package com.littleescape.api.service;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.type.AirQuality;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.TimeOfDay;
import com.littleescape.api.domain.type.Weather;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationService {

    private final MissionTemplateRepository missionTemplateRepository;
    private final PlaceRepository placeRepository;
    private final ContentFilteringService contentFilteringService;
    private final RecommendationTagConflictService recommendationTagConflictService;
    private final RecommendationSupportService recommendationSupportService;
    private final PlaceScheduleFilterService placeScheduleFilterService;
    private final PlaceRecommendationScoringService placeRecommendationScoringService;
    private final RecommendationPreferenceService recommendationPreferenceService;
    private final MissionRecommendationSelectionService missionRecommendationSelectionService;

    @Transactional
    public SimulationResponse runSimulation(SimulationRequest request) {
        log.info("=== God Mode Simulation start ===");

        List<String> debugLogs = new ArrayList<>();
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
                request.userTags()
        );

        debugLogs.add(String.format(
                "Simulation context: %s (%s, hour=%d)",
                context.getTargetDateTime(),
                context.getDayOfWeek(),
                context.getHour()
        ));
        debugLogs.add(String.format(
                "Location: (%.4f, %.4f), radius=%dkm",
                context.getLatitude(),
                context.getLongitude(),
                context.getSearchRadius()
        ));
        debugLogs.add(String.format(
                "Environment: weather=%s, temperature=%.1fC, airQuality=%s",
                context.getWeather(),
                context.getTemperature(),
                context.getAirQuality()
        ));
        debugLogs.add(String.format(
                "Persona: congestion=%s, mbti=%s",
                context.getCongestion(),
                context.getUserMbti()
        ));
        if (context.hasUserTags()) {
            debugLogs.add("User constraints: " + recommendationTagConflictService.normalizeUserTags(context.getUserTags()));
        }

        RecommendationPreferenceService.UserPreferenceProfile preferenceProfile =
                request.userId() != null ? recommendationPreferenceService.buildProfile(request.userId()) : null;
        appendPreferenceProfileDebug(debugLogs, request.userId(), preferenceProfile);

        MissionFilterResult missionResult = filterMissions(context, request.forcedCategory(), debugLogs);
        List<SimulationResponse.StageInfo> stages = new ArrayList<>(missionResult.stages());

        if (missionResult.candidates().isEmpty()) {
            debugLogs.add("No mission candidates matched the current simulation conditions.");
            stages.add(buildFinalSelectionStage(List.of(), null, List.of(), null, false));

            return new SimulationResponse(
                    null,
                    null,
                    debugLogs,
                    stages,
                    missionResult.totalCount(),
                    0,
                    0,
                    0,
                    List.of(),
                    List.of()
            );
        }

        MissionRecommendationSelectionService.MissionSelectionResult missionSelectionResult =
                missionRecommendationSelectionService.selectMission(missionResult.candidates(), preferenceProfile);
        List<MissionTemplate> missionCandidates = missionSelectionResult.rankedCandidates().stream()
                .map(MissionRecommendationSelectionService.MissionCandidateScore::mission)
                .collect(Collectors.toList());
        MissionTemplate selectedMission = missionSelectionResult.selected().mission();
        stages.add(buildMissionSelectionStage(missionSelectionResult, preferenceProfile, request.userId()));
        debugLogs.add(String.format(
                "Selected mission: %s (%s, %s, weight=%.2f, point=%.3f/%.3f)",
                selectedMission.getTitle(),
                selectedMission.getCategory(),
                selectedMission.getDifficultyLevel(),
                missionSelectionResult.selected().categoryWeight(),
                missionSelectionResult.selectedPoint(),
                missionSelectionResult.totalWeight()
        ));

        boolean isPlaceRequired = Boolean.TRUE.equals(selectedMission.getIsPlaceRequired());
        debugLogs.add(isPlaceRequired
                ? "Selected mission requires a place. Running place pipeline."
                : "Selected mission does not require a place. DevConsole still runs the place pipeline for inspection.");

        PlaceFilterResult placeResult = filterPlaces(context, selectedMission.getCategory(), debugLogs);
        List<Place> placeCandidates = new ArrayList<>(placeResult.candidates());
        Place selectedPlace = null;
        SimulationResponse.PlaceInfo placeInfo = null;

        if (!placeCandidates.isEmpty()) {
            PlaceRecommendationScoringService.PlaceSelectionResult placeSelectionResult =
                    placeRecommendationScoringService.selectTopPlace(
                            placeCandidates,
                            new PlaceRecommendationScoringService.PlaceRankingContext(
                                    selectedMission.getCategory(),
                                    context.getUserTags(),
                                    context.getLatitude(),
                                    context.getLongitude(),
                                    context.getSearchRadius(),
                                    context,
                                    preferenceProfile
                            )
                    );
            selectedPlace = placeSelectionResult.selected() != null
                    ? placeSelectionResult.selected().place()
                    : null;
            placeInfo = SimulationResponse.PlaceInfo.from(selectedPlace);
            debugLogs.add(String.format(
                    "Selected place: %s (%s, score=%.1f, tieBreak=%s)",
                    selectedPlace.getName(),
                    selectedPlace.getCategory(),
                    placeSelectionResult.selected().totalScore(),
                    placeSelectionResult.tieBreakApplied()
            ));
        } else {
            debugLogs.add(isPlaceRequired
                    ? "No place candidates survived the pipeline for the selected mission."
                    : "No place candidates survived the pipeline.");
        }

        stages.addAll(placeResult.stages());
        stages.add(buildFinalSelectionStage(
                missionCandidates,
                selectedMission,
                placeCandidates,
                selectedPlace,
                isPlaceRequired
        ));

        List<MissionTemplateResponse> allMissions = missionCandidates.stream()
                .map(MissionTemplateResponse::from)
                .collect(Collectors.toList());
        List<SimulationResponse.PlaceInfo> allPlaces = placeCandidates.stream()
                .map(SimulationResponse.PlaceInfo::from)
                .collect(Collectors.toList());

        log.info("=== God Mode Simulation complete ===");
        return new SimulationResponse(
                MissionTemplateResponse.from(selectedMission),
                placeInfo,
                debugLogs,
                stages,
                missionResult.totalCount(),
                missionCandidates.size(),
                placeResult.totalCount(),
                placeCandidates.size(),
                allMissions,
                allPlaces
        );
    }

    private MissionFilterResult filterMissions(
            EnvironmentContext context,
            MissionCategory forcedCategory,
            List<String> debugLogs
    ) {
        List<SimulationResponse.StageInfo> stages = new ArrayList<>();
        List<MissionTemplate> allMissions = missionTemplateRepository.findAll();
        List<TimeOfDay> targetTimes = analyzeTimeOfDay(context, debugLogs);
        List<LocationType> targetLocations = analyzeLocation(context, debugLogs);

        List<SimulationResponse.ReasonInfo> baseReasons = new ArrayList<>();
        List<MissionTemplate> scopedMissions = allMissions;

        if (forcedCategory != null) {
            scopedMissions = allMissions.stream()
                    .filter(mission -> mission.getCategory() == forcedCategory)
                    .collect(Collectors.toList());
            baseReasons.add(reason(
                    "FORCED_CATEGORY",
                    allMissions.size(),
                    scopedMissions.size(),
                    "forcedCategory=" + forcedCategory
            ));
            debugLogs.add("Forced mission category applied: " + forcedCategory);
        }

        List<MissionTemplate> timeLocationCandidates = scopedMissions.stream()
                .filter(mission -> targetTimes.contains(mission.getTimeOfDay()))
                .filter(mission -> targetLocations.contains(mission.getLocationType()))
                .collect(Collectors.toList());

        baseReasons.add(reason(
                "TIME_LOCATION_MATCH",
                scopedMissions.size(),
                timeLocationCandidates.size(),
                "times=" + targetTimes + ", locations=" + targetLocations
        ));
        debugLogs.add("Mission candidates after time/location filter: " + timeLocationCandidates.size());

        stages.add(stage(
                "MISSION_TIME_LOCATION_FILTER",
                "Mission: time/location filter",
                "MISSION",
                allMissions.size(),
                timeLocationCandidates.size(),
                baseReasons,
                List.of()
        ));

        FilterOutcome<MissionTemplate> contextFiltered = applyMissionContextFilters(
                timeLocationCandidates,
                context,
                debugLogs
        );

        stages.add(stage(
                "MISSION_CONTEXT_FILTER",
                "Mission: schedule/tag filter",
                "MISSION",
                timeLocationCandidates.size(),
                contextFiltered.candidates().size(),
                contextFiltered.reasons(),
                List.of()
        ));

        return new MissionFilterResult(
                contextFiltered.candidates(),
                allMissions.size(),
                stages
        );
    }

    private List<TimeOfDay> analyzeTimeOfDay(EnvironmentContext context, List<String> debugLogs) {
        List<TimeOfDay> times = recommendationSupportService.resolveTimeOfDayOptions(context);
        TimeOfDay primaryTime = times.stream()
                .filter(time -> time != TimeOfDay.ANY)
                .findFirst()
                .orElse(TimeOfDay.ANY);
        debugLogs.add("Time of day resolved to " + primaryTime + ".");
        return times;
    }

    private List<LocationType> analyzeLocation(EnvironmentContext context, List<String> debugLogs) {
        List<LocationType> locations = recommendationSupportService.resolveLocationTypes(context);

        if (context.isOutdoorRestricted()) {
            debugLogs.add("Outdoor activity restricted. Indoor-only mission scope enabled.");
        } else if (context.isIndoorPreferred()) {
            debugLogs.add("Indoor preference enabled by weather or air quality.");
        } else {
            debugLogs.add("Indoor and outdoor mission scope enabled.");
        }

        return locations;
    }

    private FilterOutcome<MissionTemplate> applyMissionContextFilters(
            List<MissionTemplate> candidates,
            EnvironmentContext context,
            List<String> debugLogs
    ) {
        List<MissionTemplate> filtered = new ArrayList<>(candidates);
        List<SimulationResponse.ReasonInfo> reasons = new ArrayList<>();

        if (context.isMonday()) {
            int before = filtered.size();
            filtered = filtered.stream()
                    .filter(mission -> !(mission.getCategory() == MissionCategory.CULTURE
                            && (mission.getTitle().contains("도서관")
                            || mission.getDescription().contains("도서관"))))
                    .collect(Collectors.toList());
            int after = filtered.size();

            reasons.add(reason(
                    "MONDAY_LIBRARY_EXCLUSION",
                    before,
                    after,
                    "Exclude library-style culture missions on Monday"
            ));

            if (before > after) {
                debugLogs.add("Monday rule removed " + (before - after) + " mission(s).");
            }
        }

        if (context.isLateNight()) {
            int before = filtered.size();
            filtered = filtered.stream()
                    .filter(mission -> !(mission.getCategory() == MissionCategory.CULTURE
                            && (mission.getTitle().contains("전시")
                            || mission.getTitle().contains("공연"))))
                    .collect(Collectors.toList());
            int after = filtered.size();

            reasons.add(reason(
                    "LATE_NIGHT_CULTURE_EXCLUSION",
                    before,
                    after,
                    "Exclude exhibition/performance missions after 22:00"
            ));

            if (before > after) {
                debugLogs.add("Late-night rule removed " + (before - after) + " mission(s).");
            }
        }

        FilterOutcome<MissionTemplate> tagFiltered = applyUserTagConflictFilter(
                filtered,
                context.getUserTags(),
                MissionTemplate::getTags,
                "Mission",
                debugLogs
        );
        filtered = tagFiltered.candidates();
        reasons.addAll(tagFiltered.reasons());

        if (reasons.isEmpty()) {
            reasons.add(reason(
                    "NO_MISSION_CONTEXT_FILTER",
                    filtered.size(),
                    filtered.size(),
                    "No additional mission context rules applied"
            ));
        }

        debugLogs.add("Mission candidates after context filter: " + filtered.size());
        return new FilterOutcome<>(filtered, reasons);
    }

    private PlaceFilterResult filterPlaces(
            EnvironmentContext context,
            MissionCategory missionCategory,
            List<String> debugLogs
    ) {
        List<SimulationResponse.StageInfo> stages = new ArrayList<>();
        List<Place> activePlaces = placeRepository.findByIsActiveTrue();
        List<MissionCategory> targetCategories = getCategoryMapping(missionCategory);

        debugLogs.add("Mapped place categories: " + targetCategories);

        List<Place> categoryScopedPlaces = loadActivePlacesForCategories(targetCategories);
        stages.add(stage(
                "PLACE_CATEGORY_MAPPING",
                "Place: category mapping",
                "PLACE",
                activePlaces.size(),
                categoryScopedPlaces.size(),
                List.of(reason(
                        "CATEGORY_MAPPING",
                        activePlaces.size(),
                        categoryScopedPlaces.size(),
                        "mappedCategories=" + targetCategories
                )),
                List.of()
        ));

        int distanceBaseCount = categoryScopedPlaces.size();
        List<SimulationResponse.ReasonInfo> distanceReasons = new ArrayList<>();
        List<Place> distanceCandidates;

        if (categoryScopedPlaces.isEmpty()) {
            distanceBaseCount = activePlaces.size();
            distanceReasons.add(reason(
                    "CATEGORY_FALLBACK_ALL_ACTIVE",
                    0,
                    activePlaces.size(),
                    "No active places found in mapped categories"
            ));
            debugLogs.add("Category mapping returned 0 active places. Falling back to all active places.");
            distanceCandidates = placeRepository.findAllWithDistanceAndRadius(
                    context.getLatitude(),
                    context.getLongitude(),
                    context.getSearchRadius()
            );
        } else {
            distanceCandidates = queryPlacesByCategoriesWithinRadius(targetCategories, context);
        }

        distanceCandidates = deduplicatePlaces(distanceCandidates);
        distanceReasons.add(reason(
                "DISTANCE_RADIUS_FILTER",
                distanceBaseCount,
                distanceCandidates.size(),
                "radiusKm=" + context.getSearchRadius()
        ));
        debugLogs.add("Place candidates after distance filter: " + distanceCandidates.size());

        stages.add(stage(
                "PLACE_DISTANCE_FILTER",
                "Place: distance filter",
                "PLACE",
                distanceBaseCount,
                distanceCandidates.size(),
                distanceReasons,
                List.of()
        ));

        FilterOutcome<Place> keywordFiltered = applyKeywordFilter(distanceCandidates, debugLogs);
        stages.add(stage(
                "PLACE_KEYWORD_FILTER",
                "Place: content keyword filter",
                "PLACE",
                distanceCandidates.size(),
                keywordFiltered.candidates().size(),
                keywordFiltered.reasons(),
                List.of()
        ));

        FilterOutcome<Place> scheduleFiltered = applyPerformanceFilter(
                keywordFiltered.candidates(),
                context.getTargetDateTime(),
                LocalDate.now(),
                debugLogs
        );
        stages.add(stage(
                "PLACE_SCHEDULE_FILTER",
                "Place: performance/schedule filter",
                "PLACE",
                keywordFiltered.candidates().size(),
                scheduleFiltered.candidates().size(),
                scheduleFiltered.reasons(),
                List.of()
        ));

        FilterOutcome<Place> personalized = applyPlacePersonalization(
                scheduleFiltered.candidates(),
                context,
                debugLogs
        );
        stages.add(stage(
                "PLACE_PERSONALIZATION_FILTER",
                "Place: tag/personalization filter",
                "PLACE",
                scheduleFiltered.candidates().size(),
                personalized.candidates().size(),
                personalized.reasons(),
                List.of()
        ));

        return new PlaceFilterResult(
                personalized.candidates(),
                activePlaces.size(),
                stages
        );
    }

    private List<Place> loadActivePlacesForCategories(List<MissionCategory> targetCategories) {
        LinkedHashMap<Long, Place> deduped = new LinkedHashMap<>();
        for (MissionCategory category : targetCategories) {
            for (Place place : placeRepository.findByCategoryAndIsActiveTrue(category)) {
                deduped.putIfAbsent(place.getId(), place);
            }
        }
        return new ArrayList<>(deduped.values());
    }

    private List<Place> queryPlacesByCategoriesWithinRadius(
            List<MissionCategory> targetCategories,
            EnvironmentContext context
    ) {
        List<Place> places = new ArrayList<>();
        for (MissionCategory category : targetCategories) {
            places.addAll(placeRepository.findByCategoryWithDistanceAndRadius(
                    category,
                    context.getLatitude(),
                    context.getLongitude(),
                    context.getSearchRadius()
            ));
        }
        return places;
    }

    private FilterOutcome<Place> applyKeywordFilter(List<Place> candidates, List<String> debugLogs) {
        int before = candidates.size();
        List<Place> filtered = candidates.stream()
                .filter(place -> !contentFilteringService.shouldExclude(
                        place.getName(),
                        place.getAddress(),
                        place.getTags()
                ))
                .collect(Collectors.toList());

        int after = filtered.size();
        if (before > after) {
            debugLogs.add("Keyword filter removed " + (before - after) + " place(s).");
        }

        return new FilterOutcome<>(
                filtered,
                List.of(reason(
                        "CONTENT_KEYWORD_FILTER",
                        before,
                        after,
                        "Application-level keyword exclusion"
                ))
        );
    }

    private FilterOutcome<Place> applyPlacePersonalization(
            List<Place> places,
            EnvironmentContext context,
            List<String> debugLogs
    ) {
        List<SimulationResponse.ReasonInfo> reasons = new ArrayList<>();
        List<Place> current = new ArrayList<>(places);

        FilterOutcome<Place> tagFiltered = applyUserTagConflictFilter(
                current,
                context.getUserTags(),
                Place::getTags,
                "Place",
                debugLogs
        );
        current = tagFiltered.candidates();
        reasons.addAll(tagFiltered.reasons());

        if (context.getWeather() == Weather.SUNNY && context.getAirQuality() == AirQuality.GOOD) {
            int before = current.size();
            current = current.stream()
                    .filter(place -> place.getDataSource() != DataSource.LIBRARY)
                    .collect(Collectors.toList());
            int after = current.size();

            reasons.add(reason(
                    "EXCLUDE_LIBRARY_ON_GOOD_WEATHER",
                    before,
                    after,
                    "weather=SUNNY and airQuality=GOOD"
            ));

            if (before > after) {
                debugLogs.add("Sunny/good-air preference removed " + (before - after) + " library place(s).");
            }
        }

        if (context.prefersQuietPlace()) {
            int before = current.size();
            List<Place> quietPlaces = current.stream()
                    .filter(place -> place.getTags() != null && place.getTags().contains("QUIET"))
                    .collect(Collectors.toList());

            if (!quietPlaces.isEmpty()) {
                current = quietPlaces;
                reasons.add(reason(
                        "PREFER_QUIET_TAG",
                        before,
                        current.size(),
                        "congestion=HIGH prefers QUIET-tagged places"
                ));
                debugLogs.add("Quiet-place preference narrowed candidates to " + current.size() + " place(s).");
            } else {
                reasons.add(reason(
                        "PREFER_QUIET_TAG_NO_MATCH",
                        before,
                        before,
                        "congestion=HIGH but no QUIET-tagged places were available"
                ));
            }
        }

        FilterOutcome<Place> weighted = applyDataSourceWeighting(current, context, debugLogs);
        current = weighted.candidates();
        reasons.addAll(weighted.reasons());

        if (reasons.isEmpty()) {
            reasons.add(reason(
                    "NO_PERSONALIZATION_CHANGE",
                    places.size(),
                    places.size(),
                    "No personalization rules changed the place set"
            ));
        }

        return new FilterOutcome<>(current, reasons);
    }

    private <T> FilterOutcome<T> applyUserTagConflictFilter(
            List<T> candidates,
            String userTags,
            Function<T, String> targetTagsExtractor,
            String scope,
            List<String> debugLogs
    ) {
        RecommendationTagConflictService.TagConflictFilterResult<T> result =
                recommendationTagConflictService.filterConflicts(candidates, userTags, targetTagsExtractor);

        if (result.normalizedUserTags().isEmpty()) {
            return new FilterOutcome<>(candidates, List.of());
        }

        debugLogs.add(scope + " constraints applied: " + result.normalizedUserTags());

        if (result.steps().isEmpty()) {
            return new FilterOutcome<>(
                    candidates,
                    List.of(reason(
                            "USER_TAG_CONFLICT_FILTER_SKIPPED",
                            candidates.size(),
                            candidates.size(),
                            "userTags=" + result.normalizedUserTags() + ", no supported conflict rule matched"
                    ))
            );
        }

        int removedCount = candidates.size() - result.candidates().size();
        if (removedCount > 0) {
            debugLogs.add(scope + " tag conflict filter removed " + removedCount + " candidate(s).");
        }

        List<SimulationResponse.ReasonInfo> reasons = result.steps().stream()
                .map(step -> reason(
                        step.reasonCode(),
                        step.beforeCount(),
                        step.afterCount(),
                        step.detail()
                ))
                .collect(Collectors.toList());

        return new FilterOutcome<>(result.candidates(), reasons);
    }

    private FilterOutcome<Place> applyDataSourceWeighting(
            List<Place> places,
            EnvironmentContext context,
            List<String> debugLogs
    ) {
        if (places.isEmpty()) {
            return new FilterOutcome<>(
                    places,
                    List.of(reason(
                            "DATASOURCE_WEIGHTING_SKIPPED",
                            0,
                            0,
                            "No place candidates available for weighting"
                    ))
            );
        }

        Map<DataSource, Double> weights = new HashMap<>();
        weights.put(DataSource.LIBRARY, 0.3);
        weights.put(DataSource.SEOUL_PARK, 0.8);
        weights.put(DataSource.KOPIS, 1.0);
        weights.put(DataSource.SEOUL_CULTURE, 1.0);
        weights.put(DataSource.SEOUL_RESERVATION, 1.0);
        weights.put(DataSource.SEOUL_RESTAURANT, 1.0);
        weights.put(DataSource.MANUAL, 1.0);

        double libraryWeight = recommendationSupportService.resolveLibrarySourceWeight(context);
        weights.put(DataSource.LIBRARY, libraryWeight);
        debugLogs.add(recommendationSupportService.describeLibrarySourceWeight(context));

        Map<DataSource, List<Place>> groupedBySource = places.stream()
                .collect(Collectors.groupingBy(
                        place -> place.getDataSource() != null ? place.getDataSource() : DataSource.MANUAL
                ));

        List<Place> rebalanced = new ArrayList<>();
        for (Map.Entry<DataSource, List<Place>> entry : groupedBySource.entrySet()) {
            DataSource source = entry.getKey();
            List<Place> sourcePlaces = new ArrayList<>(entry.getValue());
            double weight = weights.getOrDefault(source, 1.0);
            int maxCount = Math.max(1, (int) Math.round(sourcePlaces.size() * weight));

            Collections.shuffle(sourcePlaces);
            List<Place> selected = sourcePlaces.subList(0, Math.min(maxCount, sourcePlaces.size()));
            rebalanced.addAll(selected);

            if (selected.size() < sourcePlaces.size()) {
                debugLogs.add(String.format(
                        "Datasource weighting: %s %d -> %d (weight %.1f)",
                        source,
                        sourcePlaces.size(),
                        selected.size(),
                        weight
                ));
            }
        }

        Collections.shuffle(rebalanced);
        if (rebalanced.size() != places.size()) {
            debugLogs.add(String.format(
                    "Datasource weighting changed place count: %d -> %d",
                    places.size(),
                    rebalanced.size()
            ));
        }

        return new FilterOutcome<>(
                rebalanced,
                List.of(reason(
                        "DATASOURCE_WEIGHTING",
                        places.size(),
                        rebalanced.size(),
                        String.format("libraryWeight=%.2f", libraryWeight)
                ))
        );
    }

    private FilterOutcome<Place> applyPerformanceFilter(
            List<Place> places,
            LocalDateTime simulationDateTime,
            LocalDate today,
            List<String> debugLogs
    ) {
        PlaceScheduleFilterService.PlaceScheduleFilterResult scheduleResult =
                placeScheduleFilterService.filterPlacesBySchedule(places, simulationDateTime, today);

        int currentCount = scheduleResult.beforeCount();
        List<SimulationResponse.ReasonInfo> reasons = new ArrayList<>();

        if (scheduleResult.deactivatedCount() > 0) {
            reasons.add(reason(
                    "DEACTIVATE_EXPIRED_PERFORMANCE",
                    currentCount,
                    currentCount - scheduleResult.deactivatedCount(),
                    "expiredBeforeToday=" + scheduleResult.deactivatedCount()
            ));
            currentCount -= scheduleResult.deactivatedCount();
        }

        if (scheduleResult.notStartedCount() > 0) {
            reasons.add(reason(
                    "EXCLUDE_NOT_YET_STARTED",
                    currentCount,
                    currentCount - scheduleResult.notStartedCount(),
                    "startDate after targetDateTime: " + scheduleResult.notStartedCount()
            ));
            currentCount -= scheduleResult.notStartedCount();
        }

        if (scheduleResult.expiredCount() > 0) {
            reasons.add(reason(
                    "EXCLUDE_OUTSIDE_SIMULATION_DATE",
                    currentCount,
                    currentCount - scheduleResult.expiredCount(),
                    "endDate before targetDateTime: " + scheduleResult.expiredCount()
            ));
            currentCount -= scheduleResult.expiredCount();
        }

        if (scheduleResult.closedDayCount() > 0) {
            reasons.add(reason(
                    "EXCLUDE_CLOSED_DAY",
                    currentCount,
                    currentCount - scheduleResult.closedDayCount(),
                    "closedDays matched targetDateTime: " + scheduleResult.closedDayCount()
            ));
            currentCount -= scheduleResult.closedDayCount();
        }

        if (scheduleResult.outsideOperatingHoursCount() > 0) {
            reasons.add(reason(
                    "EXCLUDE_OUTSIDE_OPERATING_HOURS",
                    currentCount,
                    currentCount - scheduleResult.outsideOperatingHoursCount(),
                    "operatingTime excluded targetDateTime: " + scheduleResult.outsideOperatingHoursCount()
            ));
            currentCount -= scheduleResult.outsideOperatingHoursCount();
        }

        if (scheduleResult.unavailableOperationInfoCount() > 0) {
            reasons.add(reason(
                    "EXCLUDE_CLEARLY_UNAVAILABLE_OPERATION_INFO",
                    currentCount,
                    currentCount - scheduleResult.unavailableOperationInfoCount(),
                    "explicit unavailable operation info: " + scheduleResult.unavailableOperationInfoCount()
            ));
            currentCount -= scheduleResult.unavailableOperationInfoCount();
        }

        if (scheduleResult.unknownOperationalInfoCount() > 0) {
            reasons.add(reason(
                    "OPERATIONAL_INFO_FALLBACK",
                    currentCount,
                    currentCount,
                    "unparsed operation info allowed: " + scheduleResult.unknownOperationalInfoCount()
            ));
        }

        if (reasons.isEmpty()) {
            reasons.add(reason(
                    "PERFORMANCE_SCHEDULE_PASS",
                    scheduleResult.beforeCount(),
                    scheduleResult.beforeCount(),
                    "No schedule or operational exclusions applied"
            ));
        } else {
            debugLogs.add(String.format(
                    "Performance/operation filter result: %d -> %d (deactivated=%d, notStarted=%d, outsideDate=%d, closedDay=%d, outsideHours=%d, unavailableStatus=%d, unknownOperationalInfo=%d)",
                    scheduleResult.beforeCount(),
                    scheduleResult.afterCount(),
                    scheduleResult.deactivatedCount(),
                    scheduleResult.notStartedCount(),
                    scheduleResult.expiredCount(),
                    scheduleResult.closedDayCount(),
                    scheduleResult.outsideOperatingHoursCount(),
                    scheduleResult.unavailableOperationInfoCount(),
                    scheduleResult.unknownOperationalInfoCount()
            ));
            scheduleResult.exclusionDetails().stream()
                    .limit(3)
                    .forEach(detail -> debugLogs.add(String.format(
                            "Operational exclusion: %s (%s) - %s",
                            detail.placeName(),
                            detail.reasonCode(),
                            detail.detail()
                    )));
        }

        return new FilterOutcome<>(scheduleResult.filteredPlaces(), reasons);
    }

    private List<Place> deduplicatePlaces(List<Place> places) {
        LinkedHashMap<Long, Place> deduped = new LinkedHashMap<>();
        for (Place place : places) {
            deduped.putIfAbsent(place.getId(), place);
        }
        return new ArrayList<>(deduped.values());
    }

    private SimulationResponse.StageInfo buildFinalSelectionStage(
            List<MissionTemplate> missionCandidates,
            MissionTemplate selectedMission,
            List<Place> placeCandidates,
            Place selectedPlace,
            boolean isPlaceRequired
    ) {
        List<SimulationResponse.ReasonInfo> reasons = new ArrayList<>();
        List<SimulationResponse.SelectionInfo> selections = new ArrayList<>();

        reasons.add(reason(
                selectedMission != null ? "SELECT_MISSION" : "NO_MISSION_SELECTED",
                missionCandidates.size(),
                selectedMission != null ? 1 : 0,
                selectedMission != null ? selectedMission.getTitle() : "No mission selected"
        ));

        if (selectedMission != null) {
            selections.add(selection(
                    "MISSION",
                    selectedMission.getId(),
                    selectedMission.getTitle(),
                    selectedMission.getCategory().name(),
                    "finalSelected=true"
            ));
        }

        if (isPlaceRequired) {
            reasons.add(reason(
                    selectedPlace != null ? "SELECT_PLACE" : "PLACE_REQUIRED_NO_MATCH",
                    placeCandidates.size(),
                    selectedPlace != null ? 1 : 0,
                    selectedPlace != null ? selectedPlace.getName() : "Mission required a place but none survived"
            ));
        } else {
            reasons.add(reason(
                    selectedPlace != null ? "SELECT_OPTIONAL_PLACE" : "PLACE_OPTIONAL_SKIPPED",
                    placeCandidates.size(),
                    selectedPlace != null ? 1 : 0,
                    "Selected mission does not require a place"
            ));
        }

        if (selectedPlace != null) {
            selections.add(selection(
                    "PLACE",
                    selectedPlace.getId(),
                    selectedPlace.getName(),
                    selectedPlace.getCategory().name(),
                    "finalSelected=true"
            ));
        }

        return stage(
                "FINAL_SELECTION",
                "Final selection",
                "RESULT",
                missionCandidates.size() + placeCandidates.size(),
                selections.size(),
                reasons,
                selections
        );
    }

    private SimulationResponse.StageInfo stage(
            String code,
            String label,
            String targetType,
            int beforeCount,
            int afterCount,
            List<SimulationResponse.ReasonInfo> reasons,
            List<SimulationResponse.SelectionInfo> selections
    ) {
        return new SimulationResponse.StageInfo(
                code,
                label,
                targetType,
                beforeCount,
                afterCount,
                List.copyOf(reasons),
                List.copyOf(selections)
        );
    }

    private SimulationResponse.ReasonInfo reason(
            String code,
            int beforeCount,
            int afterCount,
            String detail
    ) {
        return new SimulationResponse.ReasonInfo(code, beforeCount, afterCount, detail);
    }

    private SimulationResponse.SelectionInfo selection(
            String type,
            Long id,
            String name,
            String category,
            String detail
    ) {
        return new SimulationResponse.SelectionInfo(type, id, name, category, detail);
    }

    private void appendPreferenceProfileDebug(
            List<String> debugLogs,
            Long userId,
            RecommendationPreferenceService.UserPreferenceProfile preferenceProfile
    ) {
        if (userId == null) {
            debugLogs.add("Preference profile: default mission weights (no userId supplied).");
            return;
        }

        if (preferenceProfile == null || !preferenceProfile.hasSignals()) {
            debugLogs.add("Preference profile: userId=" + userId + " has no saved/liked/completed/cancelled signals.");
            return;
        }

        debugLogs.add(String.format(
                "Preference profile: userId=%d, signals=%d",
                userId,
                preferenceProfile.signals().size()
        ));
        preferenceProfile.signals().stream()
                .limit(5)
                .forEach(signal -> debugLogs.add(String.format(
                        "Preference signal: %s/%s %s delta=%.2f (%d/%d)",
                        signal.targetType(),
                        signal.signalType(),
                        signal.key(),
                        signal.delta(),
                        signal.count(),
                        signal.totalCount()
                )));
    }

    private SimulationResponse.StageInfo buildMissionSelectionStage(
            MissionRecommendationSelectionService.MissionSelectionResult selectionResult,
            RecommendationPreferenceService.UserPreferenceProfile preferenceProfile,
            Long userId
    ) {
        int candidateCount = selectionResult.rankedCandidates().size();
        List<SimulationResponse.ReasonInfo> reasons = new ArrayList<>();

        if (userId == null) {
            reasons.add(reason(
                    "MISSION_WEIGHT_DEFAULT_PROFILE",
                    candidateCount,
                    candidateCount,
                    "No userId supplied. Category weights default to 1.0."
            ));
        } else if (preferenceProfile == null || !preferenceProfile.hasSignals()) {
            reasons.add(reason(
                    "MISSION_WEIGHT_NO_SIGNALS",
                    candidateCount,
                    candidateCount,
                    "userId=" + userId + " but no saved/liked/completed/cancelled signals were found."
            ));
        } else {
            reasons.add(reason(
                    "MISSION_WEIGHT_PROFILE_APPLIED",
                    candidateCount,
                    candidateCount,
                    String.format(
                            "userId=%d, signals=%d, topSignals=%s",
                            userId,
                            preferenceProfile.signals().size(),
                            preferenceProfile.signals().stream()
                                    .limit(3)
                                    .map(signal -> signal.signalType() + ":" + signal.key() + "(" + signal.delta() + ")")
                                    .collect(Collectors.joining(", "))
                    )
            ));
        }

        reasons.add(reason(
                "MISSION_WEIGHTED_RANDOM_SELECTION",
                candidateCount,
                selectionResult.selected() != null ? 1 : 0,
                String.format(
                        "selectedPoint=%.3f,totalWeight=%.3f,randomFraction=%.3f,selectedMissionId=%s",
                        selectionResult.selectedPoint(),
                        selectionResult.totalWeight(),
                        selectionResult.randomFraction(),
                        selectionResult.selected() != null ? selectionResult.selected().mission().getId() : "none"
                )
        ));

        Long selectedMissionId = selectionResult.selected() != null
                ? selectionResult.selected().mission().getId()
                : null;
        List<SimulationResponse.SelectionInfo> selections = selectionResult.rankedCandidates().stream()
                .limit(5)
                .map(candidate -> selection(
                        "MISSION_CANDIDATE",
                        candidate.mission().getId(),
                        candidate.mission().getTitle(),
                        candidate.mission().getCategory().name(),
                        String.format(
                                "categoryWeight=%.2f%s",
                                candidate.categoryWeight(),
                                candidate.mission().getId() != null && candidate.mission().getId().equals(selectedMissionId)
                                        ? ", selected=true"
                                        : ""
                        )
                ))
                .collect(Collectors.toList());

        return stage(
                "MISSION_WEIGHTED_SELECTION",
                "Mission: weighted selection",
                "MISSION",
                candidateCount,
                selectionResult.selected() != null ? 1 : 0,
                reasons,
                selections
        );
    }

    private List<MissionCategory> getCategoryMapping(MissionCategory missionCategory) {
        return recommendationSupportService.mapMissionToPlaceCategories(missionCategory);
    }

    private record MissionFilterResult(
            List<MissionTemplate> candidates,
            int totalCount,
            List<SimulationResponse.StageInfo> stages
    ) {
    }

    private record PlaceFilterResult(
            List<Place> candidates,
            int totalCount,
            List<SimulationResponse.StageInfo> stages
    ) {
    }

    private record FilterOutcome<T>(
            List<T> candidates,
            List<SimulationResponse.ReasonInfo> reasons
    ) {
    }
}
