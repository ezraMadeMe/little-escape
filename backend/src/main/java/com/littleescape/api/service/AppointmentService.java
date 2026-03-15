package com.littleescape.api.service;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.TimeOfDay;
import com.littleescape.api.dto.AppointmentResponse;
import com.littleescape.api.dto.FeedResponse;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.repository.PlaceRepository;
import com.littleescape.api.repository.UserRepository;
import com.littleescape.api.service.simulation.EnvironmentContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;
    private final MissionTemplateRepository missionTemplateRepository;
    private final PlaceRepository placeRepository;
    private final com.littleescape.api.repository.SavedAppointmentRepository savedAppointmentRepository;
    private final com.littleescape.api.repository.LikedAppointmentRepository likedAppointmentRepository;
    private final com.littleescape.api.repository.CommentRepository commentRepository;
    private final RecommendationTagConflictService recommendationTagConflictService;
    private final RecommendationSupportService recommendationSupportService;
    private final PlaceScheduleFilterService placeScheduleFilterService;
    private final PlaceRecommendationScoringService placeRecommendationScoringService;
    private final RecommendationEnvironmentService recommendationEnvironmentService;
    private final RecommendationPreferenceService recommendationPreferenceService;
    private final MissionRecommendationSelectionService missionRecommendationSelectionService;

    // Keywords that indicate venues outside the intended single-person recommendation scope.
    private static final String[] BAD_KEYWORDS = {
        "어린이",
        "유아",
        "강좌",
        "교실",
        "모집",
        "시니어",
        "동호회"
    };

    private static final int MIN_PLACE_CANDIDATE_POOL = 5;
    private static final int MAX_RELAXED_RADIUS_KM = 20;
    private static final int DATA_SOURCE_PER_SOURCE_CAP = 3;

    private MissionTemplate selectMissionWithCategoryWeight(
            List<MissionTemplate> candidates,
            RecommendationPreferenceService.UserPreferenceProfile preferenceProfile,
            String stageLabel
    ) {
        MissionRecommendationSelectionService.MissionSelectionResult selectionResult =
                missionRecommendationSelectionService.selectMission(candidates, preferenceProfile);

        selectionResult.rankedCandidates().stream()
                .limit(5)
                .forEach(candidate -> log.info(
                        "{} - mission candidate id={}, title={}, category={}, categoryWeight={}",
                        stageLabel,
                        candidate.mission().getId(),
                        candidate.mission().getTitle(),
                        candidate.mission().getCategory(),
                        candidate.categoryWeight()
                ));

        MissionRecommendationSelectionService.MissionCandidateScore selected = selectionResult.selected();
        log.info(
                "{} - selected mission id={}, title={}, category={}, selectedPoint={}, totalWeight={}, randomFraction={}",
                stageLabel,
                selected.mission().getId(),
                selected.mission().getTitle(),
                selected.mission().getCategory(),
                String.format("%.3f", selectionResult.selectedPoint()),
                String.format("%.3f", selectionResult.totalWeight()),
                String.format("%.3f", selectionResult.randomFraction())
        );
        return selected.mission();
    }

    @Transactional
    public Appointment createAppointment(Long userId, LocalDateTime scheduledAt, Long missionId,
                                         Double userLatitude, Double userLongitude, Integer searchRadius) {
        log.info("=== create appointment start ===");
        log.info("userId={}, scheduledAt={}, missionId={}", userId, scheduledAt, missionId);
        log.info("user location lat={}, lon={}", userLatitude, userLongitude);

        List<AppointmentStatus> activeStatuses = List.of(AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED);
        boolean hasActiveAppointment = appointmentRepository.existsByUserIdAndStatusIn(userId, activeStatuses);

        if (hasActiveAppointment) {
            log.warn("active appointment already exists for userId={}", userId);
            throw new IllegalStateException("An active appointment already exists. Complete or cancel it first.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found."));

        Appointment appointment = new Appointment();
        appointment.setUser(user);
        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setScheduledAt(scheduledAt);
        appointment.setSearchRadius(EnvironmentContext.resolveSearchRadius(searchRadius));
        log.info("resolved appointment search radius={}km", appointment.getSearchRadius());

        EnvironmentContext environmentContext = buildRealTimeEnvironmentContext(
                scheduledAt,
                userLatitude,
                userLongitude,
                appointment.getSearchRadius(),
                user
        );

        RecommendationPreferenceService.UserPreferenceProfile preferenceProfile =
                recommendationPreferenceService.buildProfile(userId);
        logPreferenceProfile("create appointment", userId, preferenceProfile);

        MissionTemplate selectedMission;
        if (missionId != null) {
            log.info("explicit mission supplied; validating mission and constraints");
            selectedMission = missionTemplateRepository.findById(missionId)
                    .orElseThrow(() -> new IllegalArgumentException("Mission not found."));
            validateMissionAgainstHardConstraints(selectedMission, user.getTags(), "create appointment explicit mission");
        } else {
            log.info("no explicit mission supplied; selecting mission from environment context");

            List<TimeOfDay> targetTimes = resolveTimeOfDayOptions(environmentContext);
            log.info("resolved target times={}", targetTimes);

            List<LocationType> targetLocations = resolveLocationTypes(environmentContext);
            log.info("resolved target locations={}", targetLocations);

            List<MissionTemplate> candidates = missionTemplateRepository
                    .findAllByTimeOfDayInAndLocationTypeIn(targetTimes, targetLocations);
            log.info("mission candidates after time/location filter={}", candidates.size());

            String userTags = user.getTags();
            if (userTags != null && !userTags.trim().isEmpty()) {
                log.info("applying user tag constraints to mission candidates: {}", userTags);
                List<MissionTemplate> filteredCandidates = candidates.stream()
                        .filter(mission -> !hasSharedTagConflict(userTags, mission.getTags()))
                        .collect(Collectors.toList());

                log.info(
                        "mission candidates after hard constraint filter={} (removed={})",
                        filteredCandidates.size(),
                        candidates.size() - filteredCandidates.size()
                );

                candidates = filteredCandidates;
                if (filteredCandidates.isEmpty()) {
                    log.warn("create appointment mission hard constraints removed every mission candidate; no fallback will bypass user constraints");
                }
            }

            if (candidates.isEmpty()) {
                throw new IllegalStateException("No mission candidate is available for the scheduled time.");
            }

            selectedMission = selectMissionWithCategoryWeight(
                    candidates,
                    preferenceProfile,
                    "create appointment mission weighting"
            );

            log.info(
                    "selected mission title={}, id={}, category={}",
                    selectedMission.getTitle(),
                    selectedMission.getId(),
                    selectedMission.getCategory()
            );
        }

        appointment.updateMission(selectedMission);
        log.info(
                "mission attached category={}, placeRequired={}",
                selectedMission.getCategory(),
                selectedMission.getIsPlaceRequired()
        );

        if (selectedMission.getIsPlaceRequired() != null && selectedMission.getIsPlaceRequired()) {
            log.info("place-required mission - ranked nearby place matching start (radius={}km)", appointment.getSearchRadius());

            Place matchedPlace = findRankedQualityPlaceNearby(
                    selectedMission.getCategory(),
                    scheduledAt,
                    environmentContext,
                    preferenceProfile
            );

            if (matchedPlace != null) {
                appointment.updatePlace(matchedPlace);
                log.info("selected place name={}, category={}", matchedPlace.getName(), matchedPlace.getCategory());
            } else {
                log.error(
                        "place matching failed: category={}, radius={}km, no viable place after filtering",
                        selectedMission.getCategory(),
                        appointment.getSearchRadius()
                );
                throw new IllegalStateException(
                        String.format(
                                "No viable place was found within %dkm for this mission.",
                                appointment.getSearchRadius()
                        )
                );
            }
        } else {
            log.info("place not required for selected mission");
            appointment.setPlace(null);
        }

        Appointment savedAppointment = appointmentRepository.save(appointment);
        log.info("=== create appointment complete (id={}) ===", savedAppointment.getId());
        log.info("mission={} (id={})", selectedMission.getTitle(), selectedMission.getId());
        log.info(
                "place={}",
                savedAppointment.getPlace() != null ? savedAppointment.getPlace().getName() : "none"
        );
        log.info("status={}", savedAppointment.getStatus());

        if (user.getMagicToken() != null) {
            log.info("clearing magic token for user {} ({})", user.getNickname(), user.getEmail());
            user.setMagicToken(null);
            user.setMagicTokenExpiry(null);
            userRepository.save(user);
        }

        return savedAppointment;
    }

    private Place findRankedQualityPlaceNearby(com.littleescape.api.domain.type.MissionCategory missionCategory,
                                               LocalDateTime scheduledAt,
                                               EnvironmentContext environmentContext,
                                               RecommendationPreferenceService.UserPreferenceProfile preferenceProfile) {
        if (environmentContext.getLatitude() == null || environmentContext.getLongitude() == null) {
            log.warn("nearby ranking requested without user coordinates; falling back to global ranking");
            return findRankedQualityPlace(missionCategory, scheduledAt, environmentContext, preferenceProfile);
        }

        log.info("=== ranked quality place search start (within {}km) ===", environmentContext.getSearchRadius());
        log.info("missionCategory={}, userLocation=({}, {}), scheduledAt={}, weather={}, airQuality={}, congestion={}, mbti={}",
                missionCategory,
                environmentContext.getLatitude(),
                environmentContext.getLongitude(),
                scheduledAt,
                environmentContext.getWeather(),
                environmentContext.getAirQuality(),
                environmentContext.getCongestion(),
                environmentContext.getUserMbti());

        List<com.littleescape.api.domain.type.MissionCategory> targetCategories =
                resolveCategoryMapping(missionCategory);
        int strictRadius = EnvironmentContext.resolveSearchRadius(environmentContext.getSearchRadius());
        int relaxedRadius = relaxedSearchRadius(strictRadius);
        List<Place> candidatePool = queryNearbyPlaceCandidates(
                targetCategories,
                scheduledAt,
                environmentContext,
                strictRadius,
                false,
                "strict nearby category"
        );

        if (candidatePool.size() < MIN_PLACE_CANDIDATE_POOL && relaxedRadius > strictRadius) {
            int beforeCount = candidatePool.size();
            List<Place> relaxedDistanceCandidates = queryNearbyPlaceCandidates(
                    targetCategories,
                    scheduledAt,
                    environmentContext,
                    relaxedRadius,
                    false,
                    "fallback relax distance"
            );
            candidatePool = mergeDistinctPlaces(candidatePool, relaxedDistanceCandidates);
            log.info(
                    "fallback RELAX_DISTANCE applied: radiusKm {} -> {}, candidates {} -> {}",
                    strictRadius,
                    relaxedRadius,
                    beforeCount,
                    candidatePool.size()
            );
        }

        if (candidatePool.size() < MIN_PLACE_CANDIDATE_POOL) {
            int beforeCount = candidatePool.size();
            List<Place> relaxedCategoryCandidates = queryNearbyPlaceCandidates(
                    targetCategories,
                    scheduledAt,
                    environmentContext,
                    relaxedRadius,
                    true,
                    "fallback relax category"
            );
            candidatePool = mergeDistinctPlaces(candidatePool, relaxedCategoryCandidates);
            log.info(
                    "fallback RELAX_CATEGORY applied: radiusKm={}, candidates {} -> {}",
                    relaxedRadius,
                    beforeCount,
                    candidatePool.size()
            );
        }

        if (candidatePool.isEmpty()) {
            log.warn(
                    "nearby place fallback exhausted while preserving hard constraints {}",
                    recommendationTagConflictService.normalizeHardConstraintTags(environmentContext.getUserTags())
            );
            return null;
        }

        List<Place> diversifiedCandidates = diversifyDataSources(candidatePool, "nearby ranking");
        return selectRankedPlace(
                diversifiedCandidates,
                missionCategory,
                environmentContext,
                preferenceProfile,
                "nearby ranking"
        );
    }

    private Place findRankedQualityPlace(com.littleescape.api.domain.type.MissionCategory missionCategory,
                                         LocalDateTime scheduledAt,
                                         EnvironmentContext environmentContext,
                                         RecommendationPreferenceService.UserPreferenceProfile preferenceProfile) {
        log.info("=== ranked quality place search start (no distance input) ===");
        log.info("missionCategory={}, scheduledAt={}, weather={}, airQuality={}, congestion={}, mbti={}",
                missionCategory,
                scheduledAt,
                environmentContext.getWeather(),
                environmentContext.getAirQuality(),
                environmentContext.getCongestion(),
                environmentContext.getUserMbti());

        List<com.littleescape.api.domain.type.MissionCategory> targetCategories =
                resolveCategoryMapping(missionCategory);
        log.info("fallback RELAX_DISTANCE skipped: user location unavailable");

        List<Place> candidatePool = queryGlobalPlaceCandidates(
                targetCategories,
                scheduledAt,
                environmentContext,
                false,
                "strict global category"
        );

        if (candidatePool.size() < MIN_PLACE_CANDIDATE_POOL) {
            int beforeCount = candidatePool.size();
            List<Place> relaxedCategoryCandidates = queryGlobalPlaceCandidates(
                    targetCategories,
                    scheduledAt,
                    environmentContext,
                    true,
                    "fallback global category relax"
            );
            candidatePool = mergeDistinctPlaces(candidatePool, relaxedCategoryCandidates);
            log.info(
                    "fallback RELAX_CATEGORY applied without distance input: candidates {} -> {}",
                    beforeCount,
                    candidatePool.size()
            );
        }

        if (candidatePool.isEmpty()) {
            log.warn(
                    "global place fallback exhausted while preserving hard constraints {}",
                    recommendationTagConflictService.normalizeHardConstraintTags(environmentContext.getUserTags())
            );
            return null;
        }

        List<Place> diversifiedCandidates = diversifyDataSources(candidatePool, "default ranking");
        return selectRankedPlace(
                diversifiedCandidates,
                missionCategory,
                environmentContext,
                preferenceProfile,
                "default ranking"
        );
    }

    private Place selectRankedPlace(List<Place> candidates,
                                    com.littleescape.api.domain.type.MissionCategory missionCategory,
                                    EnvironmentContext environmentContext,
                                    RecommendationPreferenceService.UserPreferenceProfile preferenceProfile,
                                    String stageLabel) {
        PlaceRecommendationScoringService.PlaceSelectionResult selectionResult =
                placeRecommendationScoringService.selectTopPlace(
                        candidates,
                        new PlaceRecommendationScoringService.PlaceRankingContext(
                                missionCategory,
                                environmentContext != null ? environmentContext.getUserTags() : null,
                                environmentContext != null ? environmentContext.getLatitude() : null,
                                environmentContext != null ? environmentContext.getLongitude() : null,
                                EnvironmentContext.resolveSearchRadius(
                                        environmentContext != null ? environmentContext.getSearchRadius() : null
                                ),
                                environmentContext,
                                preferenceProfile
                        )
                );

        logPlaceRanking(stageLabel, selectionResult);
        return selectionResult.selected() != null ? selectionResult.selected().place() : null;
    }

    private List<Place> queryNearbyPlaceCandidates(List<com.littleescape.api.domain.type.MissionCategory> targetCategories,
                                                   LocalDateTime scheduledAt,
                                                   EnvironmentContext environmentContext,
                                                   int radiusKm,
                                                   boolean relaxCategory,
                                                   String stageLabel) {
        List<Place> queriedPlaces = new ArrayList<>();
        if (relaxCategory) {
            queriedPlaces.addAll(placeRepository.findAllFilteredWithDistanceAndRadius(
                    environmentContext.getLatitude(),
                    environmentContext.getLongitude(),
                    radiusKm,
                    BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                    BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
            ));
        } else {
            for (com.littleescape.api.domain.type.MissionCategory targetCategory : targetCategories) {
                List<Place> filteredPlaces = placeRepository.findByCategoryFilteredWithDistanceAndRadius(
                        targetCategory,
                        environmentContext.getLatitude(),
                        environmentContext.getLongitude(),
                        radiusKm,
                        BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                        BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
                );
                log.info("{} - queried category {} count={}", stageLabel, targetCategory, filteredPlaces.size());
                queriedPlaces.addAll(filteredPlaces);
            }
        }

        return finalizePlaceCandidates(
                queriedPlaces,
                scheduledAt,
                environmentContext.getUserTags(),
                stageLabel
        );
    }

    private List<Place> queryGlobalPlaceCandidates(List<com.littleescape.api.domain.type.MissionCategory> targetCategories,
                                                   LocalDateTime scheduledAt,
                                                   EnvironmentContext environmentContext,
                                                   boolean relaxCategory,
                                                   String stageLabel) {
        List<Place> queriedPlaces = new ArrayList<>();
        if (relaxCategory) {
            queriedPlaces.addAll(placeRepository.findAllFiltered(
                    BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                    BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
            ));
        } else {
            for (com.littleescape.api.domain.type.MissionCategory targetCategory : targetCategories) {
                List<Place> filteredPlaces = placeRepository.findByCategoryFiltered(
                        targetCategory,
                        BAD_KEYWORDS[0], BAD_KEYWORDS[1], BAD_KEYWORDS[2], BAD_KEYWORDS[3],
                        BAD_KEYWORDS[4], BAD_KEYWORDS[5], BAD_KEYWORDS[6]
                );
                log.info("{} - queried category {} count={}", stageLabel, targetCategory, filteredPlaces.size());
                queriedPlaces.addAll(filteredPlaces);
            }
        }

        return finalizePlaceCandidates(
                queriedPlaces,
                scheduledAt,
                environmentContext != null ? environmentContext.getUserTags() : null,
                stageLabel
        );
    }

    private List<Place> finalizePlaceCandidates(List<Place> queriedPlaces,
                                                LocalDateTime scheduledAt,
                                                String userTags,
                                                String stageLabel) {
        List<Place> deduplicatedPlaces = mergeDistinctPlaces(List.of(), queriedPlaces);
        List<Place> availablePlaces = filterPlacesByAvailability(deduplicatedPlaces, scheduledAt, stageLabel);
        RecommendationTagConflictService.TagConflictFilterResult<Place> hardConstraintResult =
                recommendationTagConflictService.filterConflicts(availablePlaces, userTags, Place::getTags);

        log.info(
                "{} - hard constraints {} kept {} of {} available places",
                stageLabel,
                hardConstraintResult.normalizedUserTags(),
                hardConstraintResult.candidates().size(),
                availablePlaces.size()
        );
        hardConstraintResult.steps().forEach(step -> log.info(
                "{} - hard constraint reason={}, before={}, after={}, detail={}",
                stageLabel,
                step.reasonCode(),
                step.beforeCount(),
                step.afterCount(),
                step.detail()
        ));

        if (!availablePlaces.isEmpty() && hardConstraintResult.candidates().isEmpty()) {
            log.warn("{} - hard constraints removed every place candidate and will not be relaxed", stageLabel);
        }

        return hardConstraintResult.candidates();
    }

    private List<Place> mergeDistinctPlaces(List<Place> basePlaces, List<Place> additionalPlaces) {
        Map<String, Place> distinctPlaces = new java.util.LinkedHashMap<>();

        for (Place place : basePlaces) {
            distinctPlaces.putIfAbsent(placeKey(place), place);
        }
        for (Place place : additionalPlaces) {
            distinctPlaces.putIfAbsent(placeKey(place), place);
        }

        return new ArrayList<>(distinctPlaces.values());
    }

    private List<Place> diversifyDataSources(List<Place> candidates, String stageLabel) {
        if (candidates.size() <= MIN_PLACE_CANDIDATE_POOL) {
            return candidates;
        }

        Map<com.littleescape.api.domain.type.DataSource, List<Place>> groupedBySource = candidates.stream()
                .collect(Collectors.groupingBy(
                        place -> place.getDataSource() != null
                                ? place.getDataSource()
                                : com.littleescape.api.domain.type.DataSource.MANUAL
                ));

        if (groupedBySource.size() <= 1) {
            log.info("{} - fallback DIVERSIFY_DATASOURCE skipped: only one data source present", stageLabel);
            return candidates;
        }

        List<Place> diversifiedCandidates = groupedBySource.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .flatMap(entry -> entry.getValue().stream().limit(DATA_SOURCE_PER_SOURCE_CAP))
                .collect(Collectors.toList());

        if (diversifiedCandidates.size() != candidates.size()) {
            log.info(
                    "{} - fallback DIVERSIFY_DATASOURCE applied: candidates {} -> {}, sources={}",
                    stageLabel,
                    candidates.size(),
                    diversifiedCandidates.size(),
                    groupedBySource.keySet()
            );
        }

        return diversifiedCandidates;
    }

    private int relaxedSearchRadius(int baseRadiusKm) {
        return Math.min(MAX_RELAXED_RADIUS_KM, Math.max(baseRadiusKm + 5, baseRadiusKm * 2));
    }

    private String placeKey(Place place) {
        if (place.getId() != null) {
            return "id:" + place.getId();
        }
        return "name:" + String.valueOf(place.getName()) + "|address:" + String.valueOf(place.getAddress());
    }

    private void logPlaceRanking(String stageLabel,
                                 PlaceRecommendationScoringService.PlaceSelectionResult selectionResult) {
        if (selectionResult.rankedCandidates().isEmpty()) {
            log.warn("{} - no place candidates available for ranking", stageLabel);
            return;
        }

        selectionResult.rankedCandidates().stream()
                .limit(3)
                .forEach(candidate -> log.info(
                        "{} - candidate placeId={}, name={}, totalScore={}, distanceKm={}, components={}",
                        stageLabel,
                        candidate.place().getId(),
                        candidate.place().getName(),
                        candidate.totalScore(),
                        candidate.distanceKm(),
                        candidate.components()
                ));

        PlaceRecommendationScoringService.PlaceScore selected = selectionResult.selected();
        log.info(
                "{} - selected placeId={}, name={}, totalScore={}, tieCandidates={}, tieBreakApplied={}, components={}",
                stageLabel,
                selected.place().getId(),
                selected.place().getName(),
                selected.totalScore(),
                selectionResult.tieCandidateCount(),
                selectionResult.tieBreakApplied(),
                selected.components()
        );
    }

    private EnvironmentContext buildRealTimeEnvironmentContext(LocalDateTime targetDateTime,
                                                               Double latitude,
                                                               Double longitude,
                                                               Integer searchRadius,
                                                               User user) {
        RecommendationEnvironmentService.RealTimeEnvironmentSnapshot snapshot =
                recommendationEnvironmentService.resolveSnapshot(latitude, longitude);

        EnvironmentContext context = EnvironmentContext.fromRealTime(
                targetDateTime,
                latitude,
                longitude,
                searchRadius,
                snapshot.weather(),
                snapshot.temperature(),
                snapshot.airQuality(),
                snapshot.congestion(),
                user != null ? user.getMbti() : null,
                user != null ? user.getTags() : null
        );

        log.info(
                "real-time environment resolved: source={}, searchRadius={}km, weather={}, temperature={}, airQuality={}, congestion={}, indoorPreferred={}, outdoorRestricted={}, quietPreferred={}, mbti={}",
                snapshot.source(),
                context.getSearchRadius(),
                context.getWeather(),
                context.getTemperature(),
                context.getAirQuality(),
                context.getCongestion(),
                context.isIndoorPreferred(),
                context.isOutdoorRestricted(),
                context.prefersQuietPlace(),
                context.getUserMbti()
        );
        return context;
    }

    private List<TimeOfDay> resolveTimeOfDayOptions(EnvironmentContext environmentContext) {
        return recommendationSupportService.resolveTimeOfDayOptions(environmentContext);
    }

    private List<LocationType> resolveLocationTypes(EnvironmentContext environmentContext) {
        return recommendationSupportService.resolveLocationTypes(environmentContext);
    }

    private boolean hasSharedTagConflict(String userTags, String targetTags) {
        return recommendationTagConflictService.hasConflict(userTags, targetTags);
    }

    private List<com.littleescape.api.domain.type.MissionCategory> resolveCategoryMapping(
        com.littleescape.api.domain.type.MissionCategory missionCategory) {
        return recommendationSupportService.mapMissionToPlaceCategories(missionCategory);
    }

    private List<Place> filterPlacesByAvailability(List<Place> places,
                                                   LocalDateTime scheduledAt,
                                                   String stageLabel) {
        PlaceScheduleFilterService.PlaceScheduleFilterResult scheduleResult =
                placeScheduleFilterService.filterPlacesBySchedule(places, scheduledAt, LocalDate.now());

        if (scheduleResult.beforeCount() != scheduleResult.afterCount()
                || scheduleResult.unknownOperationalInfoCount() > 0) {
            log.info("{} - schedule filter: {} -> {} (deactivated={}, expired={}, notStarted={}, closedDay={}, outsideHours={}, unavailableStatus={}, unknownOperationalInfo={})",
                    stageLabel,
                    scheduleResult.beforeCount(),
                    scheduleResult.afterCount(),
                    scheduleResult.deactivatedCount(),
                    scheduleResult.expiredCount(),
                    scheduleResult.notStartedCount(),
                    scheduleResult.closedDayCount(),
                    scheduleResult.outsideOperatingHoursCount(),
                    scheduleResult.unavailableOperationInfoCount(),
                    scheduleResult.unknownOperationalInfoCount());
            scheduleResult.exclusionDetails().stream()
                    .limit(3)
                    .forEach(detail -> log.info(
                            "{} - schedule exclusion: placeId={}, placeName={}, reason={}, detail={}",
                            stageLabel,
                            detail.placeId(),
                            detail.placeName(),
                            detail.reasonCode(),
                            detail.detail()
                    ));
        }

        return scheduleResult.filteredPlaces();
    }

    @Transactional
    public Long updateAppointmentMission(Long userId, Long appointmentId, Long missionId) {
        log.info("=== 약속 미션 업데이트 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}, 미션 ID: {}", userId, appointmentId, missionId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속이 존재하지 않습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 약속만 수정할 수 있습니다.");
        }

        MissionTemplate missionTemplate = missionTemplateRepository.findById(missionId)
                .orElseThrow(() -> new IllegalArgumentException("미션을 찾을 수 없습니다."));

        log.info("미션 카테고리: {}", missionTemplate.getCategory());

        // 미션 설정
        validateMissionAgainstHardConstraints(missionTemplate, appointment.getUser().getTags(), "update appointment mission");
        appointment.updateMission(missionTemplate);

        // 필터링된 양질의 장소 매칭 로직
        log.info("카테고리 {}에 해당하는 필터링된 장소 조회 중...", missionTemplate.getCategory());

        EnvironmentContext environmentContext = buildRealTimeEnvironmentContext(
                appointment.getScheduledAt(),
                null,
                null,
                appointment.getSearchRadius(),
                appointment.getUser()
        );
        RecommendationPreferenceService.UserPreferenceProfile preferenceProfile =
                recommendationPreferenceService.buildProfile(userId);
        logPreferenceProfile("update appointment mission", userId, preferenceProfile);
        Place matchedPlace = findRankedQualityPlace(
                missionTemplate.getCategory(),
                appointment.getScheduledAt(),
                environmentContext,
                preferenceProfile
        );

        if (matchedPlace != null) {
            appointment.updatePlace(matchedPlace);
            log.info("선택된 장소: {} (카테고리: {})", matchedPlace.getName(), matchedPlace.getCategory());
        } else {
            log.warn("장소 매칭 실패! 카테고리: {} - 필터링 후 적합한 장소가 없음", missionTemplate.getCategory());
        }

        log.info("=== 약속 미션 업데이트 완료 (ID: {}) ===", appointmentId);
        return appointment.getId();
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentDetail(Long userId, Long appointmentId) {
        log.info("=== 약속 상세 조회 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 약속만 조회할 수 있습니다.");
        }

        // visitCount 계산
        Long visitCount = 0L;
        MissionTemplate mission = appointment.getMissionTemplate();
        if (mission != null) {
            visitCount = appointmentRepository.countByUserIdAndMissionTemplateId(
                userId, mission.getId()
            );
        }

        Place place = appointment.getPlace();

        log.info("=== 약속 상세 조회 완료 (ID: {}) ===", appointmentId);

        return AppointmentResponse.from(appointment, visitCount);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMyAppointments(Long userId) {
        log.info("=== 내 약속 조회 시작 ===");
        log.info("사용자 ID: {}", userId);

        // DB 레벨에서 예정일 기준 내림차순 정렬하여 조회 (수정 요청 반영)
        List<Appointment> appointments = appointmentRepository.findAllByUserIdOrderByScheduledAtDesc(userId);
        log.info("조회된 약속 개수: {}", appointments.size());

        return appointments.stream()
                .map(appointment -> {
                    try {
                        // 안전한 null 처리로 장소 및 미션 정보 로딩
                        Place place = appointment.getPlace();
                        MissionTemplate mission = appointment.getMissionTemplate();

                        // 로그 출력 (null-safe)
                        String placeName = (place != null) ? place.getName() : "장소 미정";
                        String missionTitle = (mission != null) ? mission.getTitle() : "미션 미선택";
                        log.debug("약속 ID: {}, 미션: {}, 장소: {}",
                            appointment.getId(), missionTitle, placeName);

                        // visitCount 계산 (미션이 있는 경우만) - 정렬 순서에 영향 없음
                        Long visitCount = 0L;
                        if (mission != null) {
                            visitCount = appointmentRepository.countByUserIdAndMissionTemplateId(
                                userId, mission.getId()
                            );
                        }

                        // AppointmentResponse 생성 (모든 필드 null-safe)
                        return AppointmentResponse.from(appointment, visitCount);
                    } catch (Exception e) {
                        log.error("약속 정보 변환 중 오류 발생 (약속 ID: {}): {}",
                            appointment.getId(), e.getMessage(), e);
                        // 오류 발생 시에도 기본 정보는 반환
                        return new AppointmentResponse(
                            appointment.getId(),
                            null, // missionTitle
                            appointment.getStatus(),
                            appointment.getScheduledAt(),
                            appointment.getCreatedAt(),
                            null, null, null, null, null, // place info
                            null, null, // images
                            appointment.getProofComment(),
                            null, // proofImageUrl
                            null, // proofImageUrls
                            null, // reviewKeywords
                            null, // rating
                            0L, // visitCount
                            appointment.isFavorite(),
                            null, // missionGuide
                            null, // missionDescription
                            false // isMissionRevealed
                        );
                    }
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelAppointment(Long userId, Long appointmentId) {
        log.info("=== 약속 취소 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속이 존재하지 않습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 약속만 취소할 수 있습니다.");
        }

        // 미션이 있든 없든 상태만 변경 (NPE 방지)
        appointment.cancel();

        log.info("=== 약속 취소 완료 (ID: {}) ===", appointmentId);
    }

    @Transactional
    public void completeAppointment(Long userId, Long appointmentId,
                                    java.util.List<org.springframework.web.multipart.MultipartFile> files,
                                    com.littleescape.api.dto.AppointmentCompleteRequest request) {
        log.info("=== 약속 완료 처리 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("본인의 약속만 완료 처리할 수 있습니다.");
        }

        // 미션이 선택되지 않은 약속은 완료할 수 없음
        if (appointment.getMissionTemplate() == null) {
            throw new RuntimeException("미션을 먼저 선택해주세요.");
        }

        // 이미지 파일 처리 - 로컬 uploads/ 폴더에 저장
        java.util.List<String> imageUrls = new java.util.ArrayList<>();

        // 1. DTO에 담긴 URL이 있으면 추가 (Supabase 등 외부 스토리지 사용 시)
        if (request.proofImageUrls() != null && !request.proofImageUrls().isEmpty()) {
            log.info("DTO에서 전달된 이미지 URL 개수: {}", request.proofImageUrls().size());
            imageUrls.addAll(request.proofImageUrls());
        }

        if (files != null && !files.isEmpty()) {
            log.info("업로드된 파일 개수: {}", files.size());

            // 1. 저장할 기본 경로 설정 (프로젝트 루트/uploads)
            String projectPath = System.getProperty("user.dir");
            String uploadDirPath = projectPath + java.io.File.separator + "uploads";
            java.io.File directory = new java.io.File(uploadDirPath);

            log.info("프로젝트 경로: {}", projectPath);
            log.info("업로드 디렉토리 경로: {}", uploadDirPath);

            // 2. ⭐ 핵심: 폴더가 없으면 생성
            if (!directory.exists()) {
                boolean created = directory.mkdirs();
                if (!created) {
                    log.error("디렉토리 생성 실패: {}", uploadDirPath);
                    throw new RuntimeException("파일 저장 디렉토리 생성에 실패했습니다.");
                }
                log.info("uploads 디렉토리 생성 완료: {}", directory.getAbsolutePath());
            } else {
                log.info("uploads 디렉토리 이미 존재함: {}", directory.getAbsolutePath());
            }

            // 3. 각 파일 저장
            for (org.springframework.web.multipart.MultipartFile file : files) {
                if (file.isEmpty()) {
                    log.warn("빈 파일 건너뜀");
                    continue;
                }

                try {
                    // 원본 파일명 및 확장자 추출
                    String originalFilename = file.getOriginalFilename();
                    String extension = (originalFilename != null && originalFilename.contains("."))
                            ? originalFilename.substring(originalFilename.lastIndexOf("."))
                            : ".jpg";

                    // UUID로 고유 파일명 생성
                    String savedFileName = java.util.UUID.randomUUID().toString() + extension;
                    java.io.File dest = new java.io.File(directory, savedFileName);

                    log.info("파일 저장 시도: {} -> {}", originalFilename, dest.getAbsolutePath());

                    // 4. 파일 저장
                    file.transferTo(dest);

                    // 5. DB에 저장할 접근 URL 생성 (예: /uploads/uuid.jpg)
                    // (WebConfig에서 /uploads/** 경로를 이 폴더로 매핑해줘야 함)
                    String fileUrl = "/uploads/" + savedFileName;
                    imageUrls.add(fileUrl);

                    log.info("파일 저장 완료: {} -> {}", originalFilename, fileUrl);
                } catch (java.io.IOException e) {
                    log.error("파일 저장 중 오류 발생: {}", file.getOriginalFilename(), e);
                    throw new RuntimeException("파일 저장에 실패했습니다: " + file.getOriginalFilename(), e);
                }
            }

            log.info("총 {}개 파일 저장 완료", imageUrls.size());
        }

        // null-safe 로깅
        MissionTemplate mission = appointment.getMissionTemplate();
        Place place = appointment.getPlace();
        String missionTitle = mission.getTitle();
        String placeName = (place != null) ? place.getName() : "장소 미정";

        log.info("완료할 약속 정보 - 미션: {}, 장소: {}, 키워드: {}, 이미지 개수: {}",
                 missionTitle, placeName, request.reviewKeywords(), imageUrls.size());

        // 약속 완료 처리
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setCompletedAt(LocalDateTime.now());
        appointment.setProofComment(request.proofComment());
        if (request.rating() != null) {
            appointment.setRating(request.rating());
        }
        appointment.setPublic(true);  // 완료된 약속은 자동으로 피드에 공개

        // 다중 이미지 URL 저장
        appointment.getProofImageUrls().clear();
        appointment.getProofImageUrls().addAll(imageUrls);

        // 하위 호환성을 위해 첫 번째 이미지를 기존 필드에도 저장
        if (!imageUrls.isEmpty()) {
            appointment.setProofImageUrl(imageUrls.get(0));
        }

        // 키워드 저장
        appointment.getReviewKeywords().clear();
        appointment.getReviewKeywords().addAll(request.reviewKeywords());

        log.info("=== 약속 완료 처리 완료 (ID: {}) ===", appointmentId);
    }

    @Transactional
    public Appointment cloneAppointment(Long oldAppointmentId, User user) {
        log.info("=== 약속 복제 시작 ===");
        log.info("기존 약속 ID: {}, 사용자 ID: {}", oldAppointmentId, user.getId());

        // 기존 약속 조회
        Appointment oldAppointment = appointmentRepository.findById(oldAppointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속을 찾을 수 없습니다."));

        // 본인의 약속인지 확인
        if (!oldAppointment.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("본인의 약속만 복제할 수 있습니다.");
        }

        // 진행 중인 약속이 있는지 검증
        List<AppointmentStatus> activeStatuses = List.of(AppointmentStatus.PENDING, AppointmentStatus.ACCEPTED);
        boolean hasActiveAppointment = appointmentRepository.existsByUserIdAndStatusIn(user.getId(), activeStatuses);

        if (hasActiveAppointment) {
            log.warn("이미 진행 중인 약속이 존재함 - 사용자 ID: {}", user.getId());
            throw new IllegalStateException("이미 진행 중인 약속이 있습니다. 기존 약속을 완료하거나 취소해주세요.");
        }

        // 새로운 약속 생성
        Appointment newAppointment = new Appointment();
        newAppointment.setUser(user);
        newAppointment.setStatus(AppointmentStatus.PENDING);
        newAppointment.setSearchRadius(EnvironmentContext.resolveSearchRadius(oldAppointment.getSearchRadius()));

        // 기존 약속의 미션, 장소, 시간 정보 복사
        if (oldAppointment.getMissionTemplate() != null) {
            newAppointment.updateMission(oldAppointment.getMissionTemplate());
        }
        if (oldAppointment.getPlace() != null) {
            newAppointment.updatePlace(oldAppointment.getPlace());
        }

        // scheduledAt은 기존 약속의 시간을 복사 (NOT NULL 제약조건)
        newAppointment.setScheduledAt(oldAppointment.getScheduledAt());

        // proofImageUrl, proofComment는 null로 초기화 (새로운 인증을 위해)
        newAppointment.setProofComment(null);
        newAppointment.setProofImageUrl(null);

        Appointment savedAppointment = appointmentRepository.save(newAppointment);
        log.info("=== 약속 복제 완료 (새 약속 ID: {}) ===", savedAppointment.getId());

        return savedAppointment;
    }

    @Transactional
    public void toggleFavorite(Long userId, Long appointmentId) {
        log.info("=== 즐겨찾기 토글 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        appointment.toggleFavorite();
        appointmentRepository.save(appointment);

        log.info("=== 즐겨찾기 토글 완료 (현재 상태: {}) ===", appointment.isFavorite());
    }

    @Transactional
    public Appointment markAsArrived(Long userId, Long appointmentId) {
        log.info("=== 도착 인증 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        // 상태를 ARRIVED로 변경
        appointment.setStatus(AppointmentStatus.ARRIVED);
        Appointment savedAppointment = appointmentRepository.save(appointment);

        log.info("=== 도착 인증 완료 (상태: {}) ===", savedAppointment.getStatus());
        return savedAppointment;
    }

    @Transactional
    public void bulkDeleteAppointments(Long userId, List<Long> appointmentIds) {
        log.info("=== 다중 약속 삭제 시작 ===");
        log.info("사용자 ID: {}, 삭제할 약속 개수: {}", userId, appointmentIds.size());

        List<Appointment> appointments = appointmentRepository.findAllById(appointmentIds);

        // 권한 확인
        for (Appointment appointment : appointments) {
            if (!appointment.getUser().getId().equals(userId)) {
                throw new RuntimeException("삭제 권한이 없는 약속이 포함되어 있습니다.");
            }
        }

        appointmentRepository.deleteAll(appointments);

        log.info("=== 다중 약속 삭제 완료 ({} 건) ===", appointments.size());
    }

    /**
     * 약속 완전 삭제 (Hard Delete)
     * 약속을 DB에서 영구적으로 삭제하며, 연관된 데이터도 함께 삭제됩니다.
     * - SavedAppointment (저장 내역)
     * - LikedAppointment (좋아요 내역)
     * - Comment (댓글)
     * - Feed는 Appointment를 참조하므로 자동으로 제거됨
     */
    @Transactional
    public void hardDeleteAppointment(Long userId, Long appointmentId) {
        log.info("=== 약속 완전 삭제 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        // 권한 확인: 본인의 약속만 삭제 가능
        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        // 1. SavedAppointment 삭제 (다른 사용자가 저장한 내역 포함)
        savedAppointmentRepository.deleteByAppointmentId(appointmentId);
        log.info("SavedAppointment 삭제 완료");

        // 2. LikedAppointment 삭제 (다른 사용자가 좋아요한 내역 포함)
        likedAppointmentRepository.deleteByAppointmentId(appointmentId);
        log.info("LikedAppointment 삭제 완료");

        // 3. Comment 삭제 (다른 사용자가 작성한 댓글 포함)
        commentRepository.deleteByAppointmentId(appointmentId);
        log.info("Comment 삭제 완료");

        // 4. Appointment 삭제 (ElementCollection인 proofImageUrls, reviewKeywords는 자동 삭제됨)
        appointmentRepository.delete(appointment);
        log.info("Appointment 삭제 완료");

        log.info("=== 약속 완전 삭제 완료 (ID: {}) ===", appointmentId);
    }

    /**
     * 공개 피드 조회 (SCHEDULED, ARRIVED, COMPLETED 모두 포함)
     * @param page 페이지 번호 (0부터 시작)
     * @param size 페이지 크기
     * @return 피드 리스트
     */
    @Transactional(readOnly = true)
    public List<FeedResponse> getPublicFeed(int page, int size) {
        return getPublicFeed(null, page, size);
    }

    @Transactional(readOnly = true)
    public List<FeedResponse> getPublicFeed(Long userId, int page, int size) {
        log.info("=== 공개 피드 조회 시작 (생동감 모드) ===");
        log.info("페이지: {}, 사이즈: {}, 사용자: {}", page, size, userId);

        Pageable pageable = PageRequest.of(page, size);

        // SCHEDULED(예정), ARRIVED(도착/진행중), COMPLETED(완료) 상태 모두 조회
        List<AppointmentStatus> feedStatuses = List.of(
            AppointmentStatus.ACCEPTED,  // 예정된 약속
            AppointmentStatus.ARRIVED,   // 도착/진행 중
            AppointmentStatus.COMPLETED  // 완료
        );

        List<Appointment> appointments = appointmentRepository
            .findAllByStatusInAndIsPublicTrueOrderByUpdatedAtDesc(
                feedStatuses,
                pageable
            );

        log.info("조회된 공개 약속 개수: {}", appointments.size());

        // 상태별 필터링 로직 제거 - 모든 상태 허용
        List<FeedResponse> feedResponses = appointments.stream()
            .map(appointment -> {
                // 저장 횟수 조회
                Long saveCount = savedAppointmentRepository.countByAppointmentId(appointment.getId());
                // 댓글 횟수 조회
                Long commentCount = commentRepository.countByAppointmentId(appointment.getId());
                // 좋아요 횟수 조회
                Long likeCount = likedAppointmentRepository.countByAppointmentId(appointment.getId());

                FeedResponse response = FeedResponse.from(appointment, userId, likeCount, saveCount, commentCount);

                // 사용자별 좋아요/저장 상태 설정
                if (userId != null) {
                    boolean isLiked = likedAppointmentRepository.existsByUserIdAndAppointmentId(userId, appointment.getId());
                    boolean isSaved = savedAppointmentRepository.existsByUserIdAndAppointmentId(userId, appointment.getId());

                    // Reflection을 사용하여 필드 설정 (DTO에 setter 추가 필요)
                    return new FeedResponse(
                        response.getAppointmentId(),
                        response.getMissionTitle(),
                        response.getPlaceName(),
                        response.getProofImageUrls(),
                        response.getProofComment(),
                        response.getUserNickname(),
                        response.getCompletedAt(),
                        response.getReviewKeywords(),
                        response.getRating(),
                        response.getStatus(),
                        response.getScheduledAt(),
                        isLiked,
                        likeCount,
                        isSaved,
                        response.getSaveCount(),
                        response.getCommentCount()
                    );
                }

                return response;
            })
            .collect(Collectors.toList());

        log.info("피드 개수 (전체): {}", feedResponses.size());
        log.info("=== 공개 피드 조회 완료 ===");

        return feedResponses;
    }

    /**
     * 미션 교체 (Swap) - 사용자가 현재 미션이 마음에 들지 않을 때 다른 미션으로 교체
     * @param userId 사용자 ID
     * @param appointmentId 약속 ID
     * @return 교체된 약속 정보
     */
    @Transactional
    public AppointmentResponse swapMission(Long userId, Long appointmentId) {
        log.info("=== 미션 교체 시작 ===");
        log.info("사용자 ID: {}, 약속 ID: {}", userId, appointmentId);

        // 1. 약속 조회 및 권한 검증
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 2. 기존 미션 ID 저장 (중복 방지용)
        EnvironmentContext environmentContext = buildRealTimeEnvironmentContext(
                appointment.getScheduledAt(),
                null,
                null,
                appointment.getSearchRadius(),
                user
        );

        RecommendationPreferenceService.UserPreferenceProfile preferenceProfile =
                recommendationPreferenceService.buildProfile(userId);
        logPreferenceProfile("swap mission", userId, preferenceProfile);
        Long previousMissionId = appointment.getMissionTemplate() != null
                ? appointment.getMissionTemplate().getId()
                : null;

        log.info("기존 미션 ID: {}", previousMissionId);

        // 3. 시간/날씨 조건 분석
        List<TimeOfDay> targetTimes = resolveTimeOfDayOptions(environmentContext);
        List<LocationType> targetLocations = resolveLocationTypes(environmentContext);

        log.info("분석된 시간대: {}, 장소 타입: {}", targetTimes, targetLocations);

        // 4. 조건에 맞는 미션 후보 조회 (기존 미션 제외)
        List<MissionTemplate> candidates = missionTemplateRepository
                .findAllByTimeOfDayInAndLocationTypeIn(targetTimes, targetLocations);

        log.info("초기 후보 미션: {}개", candidates.size());

        // 5. 기존 미션 제외
        if (previousMissionId != null) {
            candidates = candidates.stream()
                    .filter(mission -> !mission.getId().equals(previousMissionId))
                    .collect(Collectors.toList());
            log.info("기존 미션 제외 후 후보: {}개", candidates.size());
        }

        // 6. 사용자 태그 필터링
        String userTags = user.getTags();
        if (userTags != null && !userTags.trim().isEmpty()) {
            log.info("🏷️ 사용자 태그 필터링 적용: {}", userTags);
            List<MissionTemplate> filteredCandidates = candidates.stream()
                    .filter(mission -> !hasSharedTagConflict(userTags, mission.getTags()))
                    .collect(Collectors.toList());

            log.info("태그 필터링 후 미션 후보: {}개", filteredCandidates.size());
            candidates = filteredCandidates;
            if (filteredCandidates.isEmpty()) {
                log.warn("swap mission hard constraints removed every mission candidate; no fallback will bypass user constraints");
            }
        }

        // 7. 후보가 없으면 에러
        if (candidates.isEmpty()) {
            throw new IllegalStateException("교체 가능한 미션을 찾을 수 없습니다. 현재 미션을 유지해주세요.");
        }

        // 8. 랜덤으로 새 미션 선택
        MissionTemplate newMission = selectMissionWithCategoryWeight(
                candidates,
                preferenceProfile,
                "swap mission weighting"
        );

        log.info("새로 선택된 미션: {} (ID: {})", newMission.getTitle(), newMission.getId());

        // 9. 약속의 미션 및 장소 업데이트
        appointment.updateMission(newMission);

        // 10. 장소 조건부 매칭
        if (newMission.getIsPlaceRequired() != null && newMission.getIsPlaceRequired()) {
            log.info("🏠 장소가 필요한 미션 - 장소 재매칭 시작");

            // 사용자의 최근 위치 정보 가져오기 (위치 정보가 있다면)
            // TODO: User 엔티티에 lastLatitude, lastLongitude 필드 추가 필요
            // 현재는 Place만 교체하고 위치는 기존 정보 활용
            Place newPlace = findRankedQualityPlace(
                    newMission.getCategory(),
                    appointment.getScheduledAt(),
                    environmentContext,
                    preferenceProfile
            );

            if (newPlace != null) {
                appointment.updatePlace(newPlace);
                log.info("✅ 새 장소: {} (카테고리: {})", newPlace.getName(), newPlace.getCategory());
            } else {
                log.error("❌ 장소 매칭 실패! 카테고리: {}", newMission.getCategory());
                throw new IllegalStateException("적합한 장소를 찾을 수 없습니다.");
            }
        } else {
            log.info("🌍 장소가 필요 없는 미션 - 어디서든 수행 가능");
            appointment.setPlace(null);
        }

        // 11. 저장
        Appointment savedAppointment = appointmentRepository.save(appointment);

        log.info("=== 미션 교체 완료 ===");
        log.info("새 미션: {} (ID: {})", newMission.getTitle(), newMission.getId());
        log.info("새 장소: {}", savedAppointment.getPlace() != null ? savedAppointment.getPlace().getName() : "없음");

        // visitCount 계산 (newMission은 이미 위에서 선언됨)
        Long visitCount = 0L;
        if (newMission != null) {
            visitCount = appointmentRepository.countByUserIdAndMissionTemplateId(
                userId, newMission.getId()
            );
        }

        return AppointmentResponse.from(savedAppointment, visitCount);
    }

    // ========================================
    // 관리자 전용 메서드
    // ========================================

    /**
     * 관리자용: 약속 시간을 현재로 변경 (Time Travel)
     * 소유자 체크 없이 강제로 변경
     */
    @Transactional
    public void adminTimeTravel(Long appointmentId) {
        log.warn("⚠️ [관리자] 약속 시간 Time Travel 실행 - ID: {}", appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException("약속을 찾을 수 없습니다."));

        // 현재 시간으로 변경
        LocalDateTime now = LocalDateTime.now();
        appointment.setScheduledAt(now);

        // 상태 변경: 미션이 있으면 ACCEPTED, 없으면 CREATED 유지
        // 단, 이미 COMPLETED나 ARRIVED 상태라면 변경하지 않음
        if (appointment.getStatus() == AppointmentStatus.PENDING || 
            appointment.getStatus() == AppointmentStatus.ACCEPTED || 
            appointment.getStatus() == AppointmentStatus.CREATED) {
            
            if (appointment.getMissionTemplate() != null) {
                appointment.setStatus(AppointmentStatus.ACCEPTED);
            } else {
                appointment.setStatus(AppointmentStatus.CREATED);
            }
        }

        appointmentRepository.save(appointment);
        log.info("✅ 약속 시간 변경 완료: {}", now);
    }

    // ========================================
    // 개발용 메서드 (테스트 전용)
    // ========================================

    /**
     * 개발용: 약속 날짜를 내일(D-1)로 변경
     * 미션 공개 알림 테스트용
     */
    @Transactional
    public Appointment unlockTomorrow(Long userId, Long appointmentId) {
        log.warn("⚠️ [개발용] 약속 날짜를 내일로 변경 시작");
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        // 내일 같은 시간으로 변경
        java.time.LocalDateTime tomorrow = java.time.LocalDateTime.now().plusDays(1);
        appointment.setScheduledAt(tomorrow);

        // 상태 변경: 미션이 있으면 ACCEPTED, 없으면 CREATED 유지 (DB 제약 조건 준수)
        if (appointment.getMissionTemplate() != null) {
            appointment.setStatus(com.littleescape.api.domain.type.AppointmentStatus.ACCEPTED);
            log.warn("  → 미션이 선택되어 있어 상태를 ACCEPTED로 변경");
        } else {
            // 미션이 없으면 CREATED 상태 유지 (UNLOCKED는 미션이 필요함)
            appointment.setStatus(com.littleescape.api.domain.type.AppointmentStatus.CREATED);
            log.warn("  → 미션이 없어 상태를 CREATED로 유지");
        }

        Appointment saved = appointmentRepository.save(appointment);
        
        log.warn("⚠️ [개발용] 약속 날짜 변경 완료: {} → {}, 상태: {}", appointmentId, tomorrow, saved.getStatus());
        
        return saved;
    }

    /**
     * 개발용: 약속 날짜를 현재 시간으로 변경
     * 인증/완료 기능 테스트용
     */
    @Transactional
    public Appointment unlockNow(Long userId, Long appointmentId) {
        log.warn("⚠️ [개발용] 약속 날짜를 현재 시간으로 변경 시작");
        
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        if (!appointment.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }

        // 현재 시간으로 변경
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        appointment.setScheduledAt(now);

        // 상태 변경: 미션이 있으면 ACCEPTED, 없으면 CREATED 유지 (DB 제약 조건 준수)
        if (appointment.getMissionTemplate() != null) {
            appointment.setStatus(com.littleescape.api.domain.type.AppointmentStatus.ACCEPTED);
            log.warn("  → 미션이 선택되어 있어 상태를 ACCEPTED로 변경");
        } else {
            // 미션이 없으면 CREATED 상태 유지 (UNLOCKED는 미션이 필요함)
            appointment.setStatus(com.littleescape.api.domain.type.AppointmentStatus.CREATED);
            log.warn("  → 미션이 없어 상태를 CREATED로 유지");
        }

        Appointment saved = appointmentRepository.save(appointment);
        
        log.warn("⚠️ [개발용] 약속 날짜 변경 완료: {} → {}, 상태: {}", appointmentId, now, saved.getStatus());

        return saved;
    }

    // ========================================
    // 저장 기능 (Scrap/Bookmark)
    // ========================================

    /**
     * 약속 좋아요/좋아요 취소 (토글 방식)
     * ESC 키보드 버튼으로 피드 게시물에 반응
     *
     * @param userId 사용자 ID
     * @param appointmentId 좋아요할 약속 ID
     * @return 좋아요 여부 (true: 좋아요됨, false: 좋아요 취소됨)
     */
    @Transactional
    public boolean toggleLikeAppointment(Long userId, Long appointmentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        // 이미 좋아요되어 있는지 확인
        java.util.Optional<com.littleescape.api.domain.LikedAppointment> existing =
                likedAppointmentRepository.findByUserIdAndAppointmentId(userId, appointmentId);

        if (existing.isPresent()) {
            // 이미 좋아요되어 있으면 삭제 (좋아요 취소)
            likedAppointmentRepository.delete(existing.get());
            log.info("약속 좋아요 취소 - 사용자: {}, 약속: {}", userId, appointmentId);
            return false;
        } else {
            // 좋아요되어 있지 않으면 새로 좋아요
            com.littleescape.api.domain.LikedAppointment likedAppointment =
                    new com.littleescape.api.domain.LikedAppointment(user, appointment);
            likedAppointmentRepository.save(likedAppointment);
            log.info("약속 좋아요 완료 - 사용자: {}, 약속: {}", userId, appointmentId);
            return true;
        }
    }

    /**
     * 약속 저장/저장 취소 (토글 방식)
     * 저장된 약속의 카테고리는 추후 추천 가중치 계산에 활용됨
     *
     * @param userId 사용자 ID
     * @param appointmentId 저장할 약속 ID
     * @return 저장 여부 (true: 저장됨, false: 저장 취소됨)
     */
    @Transactional
    public boolean toggleSaveAppointment(Long userId, Long appointmentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("약속을 찾을 수 없습니다."));

        // 이미 저장되어 있는지 확인
        java.util.Optional<com.littleescape.api.domain.SavedAppointment> existing =
                savedAppointmentRepository.findByUserIdAndAppointmentId(userId, appointmentId);

        if (existing.isPresent()) {
            // 이미 저장되어 있으면 삭제 (저장 취소)
            savedAppointmentRepository.delete(existing.get());
            log.info("약속 저장 취소 - 사용자: {}, 약속: {}", userId, appointmentId);
            return false;
        } else {
            // 저장되어 있지 않으면 새로 저장
            com.littleescape.api.domain.SavedAppointment savedAppointment =
                    new com.littleescape.api.domain.SavedAppointment(user, appointment);
            savedAppointmentRepository.save(savedAppointment);
            log.info("약속 저장 완료 - 사용자: {}, 약속: {}", userId, appointmentId);
            return true;
        }
    }

    /**
     * 사용자가 저장한 약속 목록 조회
     *
     * @param userId 사용자 ID
     * @return 저장된 약속 목록 (FeedResponse 형식)
     */
    @Transactional(readOnly = true)
    public List<FeedResponse> getSavedAppointments(Long userId) {
        List<com.littleescape.api.domain.SavedAppointment> savedAppointments =
                savedAppointmentRepository.findAllByUserIdOrderByCreatedAtDesc(userId);

        return savedAppointments.stream()
                .map(sa -> {
                    Appointment appointment = sa.getAppointment();
                    // 저장 횟수 조회
                    Long saveCount = savedAppointmentRepository.countByAppointmentId(appointment.getId());
                    // 댓글 횟수 조회
                    Long commentCount = commentRepository.countByAppointmentId(appointment.getId());
                    // 좋아요 횟수 조회
                    Long likeCount = likedAppointmentRepository.countByAppointmentId(appointment.getId());

                    FeedResponse response = FeedResponse.from(appointment, userId, likeCount, saveCount, commentCount);

                    // 저장된 목록이므로 isSavedByMe는 항상 true
                    boolean isLiked = likedAppointmentRepository.existsByUserIdAndAppointmentId(userId, appointment.getId());

                    return new FeedResponse(
                        response.getAppointmentId(),
                        response.getMissionTitle(),
                        response.getPlaceName(),
                        response.getProofImageUrls(),
                        response.getProofComment(),
                        response.getUserNickname(),
                        response.getCompletedAt(),
                        response.getReviewKeywords(),
                        response.getRating(),
                        response.getStatus(),
                        response.getScheduledAt(),
                        isLiked,
                        likeCount,
                        true,  // isSavedByMe는 항상 true
                        response.getSaveCount(),
                        response.getCommentCount()
                    );
                })
                .collect(Collectors.toList());
    }

    /**
     * 사용자가 저장한 약속들의 카테고리별 가중치 계산
     * 추천 알고리즘에서 활용
     *
     * @param userId 사용자 ID
     * @return 카테고리별 가중치 맵 (예: {FOOD: 2.0, ACTIVITY: 1.5, ...})
     */
    private void logPreferenceProfile(String stageLabel,
                                      Long userId,
                                      RecommendationPreferenceService.UserPreferenceProfile preferenceProfile) {
        if (preferenceProfile == null || !preferenceProfile.hasSignals()) {
            log.info("{} - no historical personalization signals for userId={}", stageLabel, userId);
            return;
        }

        preferenceProfile.signals().stream()
                .limit(8)
                .forEach(signal -> log.info(
                        "{} - preference signal target={}, type={}, key={}, count={}, total={}, delta={}",
                        stageLabel,
                        signal.targetType(),
                        signal.signalType(),
                        signal.key(),
                        signal.count(),
                        signal.totalCount(),
                        signal.delta()
                ));
    }

    private void validateMissionAgainstHardConstraints(MissionTemplate missionTemplate,
                                                       String userTags,
                                                       String stageLabel) {
        RecommendationTagConflictService.TagConflictFilterResult<MissionTemplate> result =
                recommendationTagConflictService.filterConflicts(
                        List.of(missionTemplate),
                        userTags,
                        MissionTemplate::getTags
                );

        if (result.candidates().isEmpty() && !result.normalizedUserTags().isEmpty()) {
            RecommendationTagConflictService.TagConflictStep step = result.steps().isEmpty()
                    ? null
                    : result.steps().get(result.steps().size() - 1);
            String reasonCode = step != null ? step.reasonCode() : "USER_TAG_CONFLICT";
            throw new IllegalArgumentException(
                    "Mission conflicts with hard user constraints: " + reasonCode + " at " + stageLabel
            );
        }
    }
}
