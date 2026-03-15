package com.littleescape.api.service;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.PlaceDetailPerformance;
import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.service.simulation.EnvironmentContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class PlaceRecommendationScoringService {

    private static final int DEFAULT_DISTANCE_RADIUS_KM = 10;
    private static final double DISTANCE_WEIGHT = 40.0;
    private static final double CATEGORY_FIT_WEIGHT = 25.0;
    private static final double PRICE_ACCESSIBILITY_WEIGHT = 15.0;
    private static final double QUIET_PREFERENCE_WEIGHT = 10.0;
    private static final double DATA_SOURCE_WEIGHT = 10.0;
    private static final double SCORE_TIE_EPSILON = 0.001;
    private static final Set<String> QUIET_PREFERENCE_TAGS = Set.of(
            "PREFER_QUIET",
            "QUIET_PREFERRED",
            "QUIET"
    );

    private final RecommendationSupportService recommendationSupportService;
    private final RecommendationTagConflictService recommendationTagConflictService;

    public List<PlaceScore> rankPlaces(List<Place> places, PlaceRankingContext context) {
        if (places == null || places.isEmpty()) {
            return List.of();
        }

        return deduplicatePlaces(places).stream()
                .map(place -> scorePlace(place, context))
                .sorted(Comparator
                        .comparingDouble(PlaceScore::totalScore).reversed()
                        .thenComparing(score -> score.place().getName(), Comparator.nullsLast(String::compareTo))
                        .thenComparing(score -> score.place().getAddress(), Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    public PlaceSelectionResult selectTopPlace(List<Place> places, PlaceRankingContext context) {
        List<PlaceScore> ranked = rankPlaces(places, context);
        if (ranked.isEmpty()) {
            return new PlaceSelectionResult(null, ranked, 0, false);
        }

        double topScore = ranked.get(0).totalScore();
        List<PlaceScore> topCandidates = ranked.stream()
                .filter(candidate -> Math.abs(candidate.totalScore() - topScore) < SCORE_TIE_EPSILON)
                .toList();

        boolean tieBreakApplied = topCandidates.size() > 1;
        PlaceScore selected = topCandidates.get(
                tieBreakApplied ? ThreadLocalRandom.current().nextInt(topCandidates.size()) : 0
        );

        return new PlaceSelectionResult(selected, ranked, topCandidates.size(), tieBreakApplied);
    }

    private List<Place> deduplicatePlaces(List<Place> places) {
        LinkedHashMap<String, Place> deduped = new LinkedHashMap<>();
        for (int index = 0; index < places.size(); index++) {
            Place place = places.get(index);
            String key = place.getId() != null
                    ? "id:" + place.getId()
                    : "idx:" + index + ":" + String.valueOf(place.getName()) + ":" + String.valueOf(place.getAddress());
            deduped.putIfAbsent(key, place);
        }
        return new ArrayList<>(deduped.values());
    }

    private PlaceScore scorePlace(Place place, PlaceRankingContext context) {
        List<ScoreComponent> components = new ArrayList<>();

        ScoreComponent distance = buildDistanceComponent(place, context);
        ScoreComponent categoryFit = buildCategoryFitComponent(
                place,
                context.missionCategory(),
                context.preferenceProfile()
        );
        ScoreComponent priceAccessibility = buildPriceAccessibilityComponent(place);
        ScoreComponent quietPreference = buildQuietPreferenceComponent(place, context);
        ScoreComponent dataSource = buildDataSourceComponent(place, context);

        components.add(distance);
        components.add(categoryFit);
        components.add(priceAccessibility);
        components.add(quietPreference);
        components.add(dataSource);

        double totalScore = roundScore(components.stream().mapToDouble(ScoreComponent::score).sum());
        return new PlaceScore(
                place,
                totalScore,
                extractDistanceKm(place, context.userLatitude(), context.userLongitude()),
                List.copyOf(components)
        );
    }

    private ScoreComponent buildDistanceComponent(Place place, PlaceRankingContext context) {
        Double distanceKm = extractDistanceKm(place, context.userLatitude(), context.userLongitude());
        if (distanceKm == null) {
            return component(
                    "DISTANCE",
                    DISTANCE_WEIGHT,
                    roundScore(DISTANCE_WEIGHT * 0.5),
                    "user location unavailable, applied neutral distance score"
            );
        }

        int radiusKm = context.distanceRadiusKm() != null && context.distanceRadiusKm() > 0
                ? context.distanceRadiusKm()
                : DEFAULT_DISTANCE_RADIUS_KM;
        double normalized = Math.max(0.0, 1.0 - (Math.min(distanceKm, radiusKm) / radiusKm));
        double score = DISTANCE_WEIGHT * normalized;

        return component(
                "DISTANCE",
                DISTANCE_WEIGHT,
                roundScore(score),
                String.format(Locale.ROOT, "distanceKm=%.2f,radiusKm=%d", distanceKm, radiusKm)
        );
    }

    private ScoreComponent buildCategoryFitComponent(Place place,
                                                     MissionCategory missionCategory,
                                                     RecommendationPreferenceService.UserPreferenceProfile preferenceProfile) {
        List<MissionCategory> mappedCategories = recommendationSupportService.mapMissionToPlaceCategories(missionCategory);
        MissionCategory placeCategory = place.getCategory();
        double preferenceWeight = preferenceProfile != null
                ? preferenceProfile.categoryWeight(placeCategory)
                : 1.0;

        if (placeCategory == missionCategory) {
            return component(
                    "MISSION_CATEGORY_FIT",
                    CATEGORY_FIT_WEIGHT,
                    applyPreferenceWeight(CATEGORY_FIT_WEIGHT, CATEGORY_FIT_WEIGHT, preferenceWeight),
                    "direct category match,preferenceWeight=" + preferenceWeight
            );
        }

        int mappedIndex = mappedCategories.indexOf(placeCategory);
        if (mappedIndex >= 0) {
            double score = mappedIndex == 1 ? 18.0 : Math.max(10.0, 18.0 - ((mappedIndex - 1) * 4.0));
            return component(
                    "MISSION_CATEGORY_FIT",
                    CATEGORY_FIT_WEIGHT,
                    applyPreferenceWeight(CATEGORY_FIT_WEIGHT, score, preferenceWeight),
                    "mapped category match index=" + mappedIndex
                            + ",mappedCategories=" + mappedCategories
                            + ",preferenceWeight=" + preferenceWeight
            );
        }

        return component(
                "MISSION_CATEGORY_FIT",
                CATEGORY_FIT_WEIGHT,
                applyPreferenceWeight(CATEGORY_FIT_WEIGHT, 6.0, preferenceWeight),
                "fallback category outside mapped categories "
                        + mappedCategories
                        + ",preferenceWeight=" + preferenceWeight
        );
    }

    private ScoreComponent buildPriceAccessibilityComponent(Place place) {
        Integer ticketPrice = resolveTicketPrice(place);

        if (Boolean.TRUE.equals(place.getIsFree()) || (ticketPrice != null && ticketPrice <= 0)) {
            return component(
                    "PRICE_ACCESSIBILITY",
                    PRICE_ACCESSIBILITY_WEIGHT,
                    PRICE_ACCESSIBILITY_WEIGHT,
                    "free entry"
            );
        }

        if (ticketPrice == null) {
            double score = isTypicallyFreeSource(place.getDataSource()) ? 12.0 : 9.0;
            return component(
                    "PRICE_ACCESSIBILITY",
                    PRICE_ACCESSIBILITY_WEIGHT,
                    score,
                    "ticket price unavailable"
            );
        }

        if (ticketPrice <= 10000) {
            return component(
                    "PRICE_ACCESSIBILITY",
                    PRICE_ACCESSIBILITY_WEIGHT,
                    12.0,
                    "ticketPrice=" + ticketPrice
            );
        }

        if (ticketPrice <= 20000) {
            return component(
                    "PRICE_ACCESSIBILITY",
                    PRICE_ACCESSIBILITY_WEIGHT,
                    9.0,
                    "ticketPrice=" + ticketPrice
            );
        }

        if (ticketPrice <= 30000) {
            return component(
                    "PRICE_ACCESSIBILITY",
                    PRICE_ACCESSIBILITY_WEIGHT,
                    5.0,
                    "ticketPrice=" + ticketPrice
            );
        }

        return component(
                "PRICE_ACCESSIBILITY",
                PRICE_ACCESSIBILITY_WEIGHT,
                2.0,
                "ticketPrice=" + ticketPrice
        );
    }

    private ScoreComponent buildQuietPreferenceComponent(Place place, PlaceRankingContext context) {
        EnvironmentContext environmentContext = context.environmentContext();
        List<String> normalizedUserTags = recommendationTagConflictService.normalizeUserTags(context.userTags());
        boolean quietPreferredByTag = normalizedUserTags.stream().anyMatch(QUIET_PREFERENCE_TAGS::contains);
        boolean quietPreferredByContext = environmentContext != null && environmentContext.prefersQuietPlace();
        boolean quietPreferred = quietPreferredByTag || quietPreferredByContext;
        boolean quietMatched = hasNormalizedTag(place.getTags(), "QUIET");

        if (!quietPreferred) {
            return component(
                    "QUIET_PREFERENCE",
                    QUIET_PREFERENCE_WEIGHT,
                    0.0,
                    "no quiet preference tag"
            );
        }

        double score = 0.0;
        if (quietMatched) {
            if (quietPreferredByTag) {
                score = QUIET_PREFERENCE_WEIGHT;
            } else if (environmentContext != null && environmentContext.isIntrovert()) {
                score = QUIET_PREFERENCE_WEIGHT;
            } else if (environmentContext != null && environmentContext.isExtrovert()) {
                score = 6.0;
            } else {
                score = 8.0;
            }
        }

        return component(
                "QUIET_PREFERENCE",
                QUIET_PREFERENCE_WEIGHT,
                score,
                quietMatched
                        ? quietPreferenceDetail(quietPreferredByTag, quietPreferredByContext, environmentContext)
                        : "quiet preference requested but place tag QUIET missing"
        );
    }

    private ScoreComponent buildDataSourceComponent(Place place, PlaceRankingContext context) {
        DataSource source = place.getDataSource() != null ? place.getDataSource() : DataSource.MANUAL;
        double baseScore = switch (source) {
            case KOPIS, SEOUL_CULTURE, MANUAL -> 10.0;
            case SEOUL_RESERVATION, SEOUL_RESTAURANT -> 9.0;
            case SEOUL_PARK -> 8.0;
            case LIBRARY -> roundScore(DATA_SOURCE_WEIGHT
                    * recommendationSupportService.resolveLibrarySourceWeight(context.environmentContext()));
        };
        double preferenceWeight = context.preferenceProfile() != null
                ? context.preferenceProfile().dataSourceWeight(source)
                : 1.0;
        double score = applyPreferenceWeight(DATA_SOURCE_WEIGHT, baseScore, preferenceWeight);

        return component(
                "DATA_SOURCE",
                DATA_SOURCE_WEIGHT,
                score,
                source == DataSource.LIBRARY
                        ? "dataSource=" + source + ","
                            + recommendationSupportService.describeLibrarySourceWeight(context.environmentContext())
                            + ",preferenceWeight=" + preferenceWeight
                        : "dataSource=" + source + ",preferenceWeight=" + preferenceWeight
        );
    }

    private String quietPreferenceDetail(boolean quietPreferredByTag,
                                         boolean quietPreferredByContext,
                                         EnvironmentContext environmentContext) {
        if (quietPreferredByTag && quietPreferredByContext) {
            return "quiet preference matched via user tag and congestion context";
        }

        if (quietPreferredByTag) {
            return "quiet preference matched via user tag";
        }

        if (environmentContext != null && environmentContext.isIntrovert()) {
            return "quiet preference matched via HIGH congestion + introvert";
        }

        if (environmentContext != null && environmentContext.isExtrovert()) {
            return "quiet preference matched via HIGH congestion + extrovert";
        }

        return "quiet preference matched via congestion context";
    }

    private Integer resolveTicketPrice(Place place) {
        PlaceDetailPerformance performanceDetail = place.getPerformanceDetail();
        if (performanceDetail != null && performanceDetail.getTicketPrice() != null) {
            return performanceDetail.getTicketPrice();
        }
        return place.getTicketPrice();
    }

    private boolean isTypicallyFreeSource(DataSource dataSource) {
        return dataSource == DataSource.LIBRARY || dataSource == DataSource.SEOUL_PARK;
    }

    private boolean hasNormalizedTag(String tags, String expectedTag) {
        if (tags == null || tags.isBlank()) {
            return false;
        }

        for (String token : tags.split(",")) {
            if (expectedTag.equals(token.trim().toUpperCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private Double extractDistanceKm(Place place, Double userLatitude, Double userLongitude) {
        if (userLatitude == null || userLongitude == null
                || place.getLatitude() == null || place.getLongitude() == null) {
            return null;
        }

        return roundScore(calculateDistanceKm(
                userLatitude,
                userLongitude,
                place.getLatitude(),
                place.getLongitude()
        ));
    }

    private double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final double earthRadiusKm = 6371.0;

        double latitudeDelta = Math.toRadians(lat2 - lat1);
        double longitudeDelta = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private ScoreComponent component(String code, double weight, double score, String detail) {
        return new ScoreComponent(code, roundScore(weight), roundScore(score), detail);
    }

    private double applyPreferenceWeight(double maxScore, double baseScore, double preferenceWeight) {
        double normalizedWeight = Math.max(0.7, Math.min(1.25, preferenceWeight));
        return roundScore(Math.min(maxScore, baseScore * normalizedWeight));
    }

    private double roundScore(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    public record PlaceRankingContext(
            MissionCategory missionCategory,
            String userTags,
            Double userLatitude,
            Double userLongitude,
            Integer distanceRadiusKm,
            EnvironmentContext environmentContext,
            RecommendationPreferenceService.UserPreferenceProfile preferenceProfile
    ) {
    }

    public record ScoreComponent(
            String code,
            double weight,
            double score,
            String detail
    ) {
    }

    public record PlaceScore(
            Place place,
            double totalScore,
            Double distanceKm,
            List<ScoreComponent> components
    ) {
    }

    public record PlaceSelectionResult(
            PlaceScore selected,
            List<PlaceScore> rankedCandidates,
            int tieCandidateCount,
            boolean tieBreakApplied
    ) {
    }
}
