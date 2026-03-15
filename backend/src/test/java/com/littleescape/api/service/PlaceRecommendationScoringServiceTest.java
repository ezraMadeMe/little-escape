package com.littleescape.api.service;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.PlaceDetailPerformance;
import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.AirQuality;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.domain.type.Weather;
import com.littleescape.api.service.simulation.EnvironmentContext;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class PlaceRecommendationScoringServiceTest {

    private final PlaceRecommendationScoringService scoringService =
            new PlaceRecommendationScoringService(
                    new RecommendationSupportService(),
                    new RecommendationTagConflictService()
            );

    @Test
    void selectTopPlace_prefersCloserAffordableQuietMatch() {
        Place quietFreePlace = place(
                "Quiet Free Studio",
                37.5000,
                127.0000,
                MissionCategory.CULTURE,
                "QUIET",
                true,
                DataSource.MANUAL,
                null
        );
        Place loudPaidPlace = place(
                "Loud Paid Hall",
                37.5010,
                127.0010,
                MissionCategory.CULTURE,
                null,
                false,
                DataSource.KOPIS,
                25000
        );
        Place farLibrary = place(
                "Far Library",
                37.5600,
                127.0600,
                MissionCategory.CULTURE,
                "QUIET",
                true,
                DataSource.LIBRARY,
                null
        );

        PlaceRecommendationScoringService.PlaceSelectionResult result = scoringService.selectTopPlace(
                List.of(loudPaidPlace, farLibrary, quietFreePlace),
                new PlaceRecommendationScoringService.PlaceRankingContext(
                        MissionCategory.CULTURE,
                        "PREFER_QUIET",
                        37.5000,
                        127.0000,
                        10,
                        EnvironmentContext.fromSimulation(
                                LocalDate.now().atStartOfDay(),
                                37.5000,
                                127.0000,
                                10,
                                Weather.CLOUDY,
                                22.0,
                                AirQuality.GOOD,
                                Congestion.HIGH,
                                "I",
                                "PREFER_QUIET"
                        ),
                        null
                )
        );

        assertThat(result.selected()).isNotNull();
        assertThat(result.selected().place().getName()).isEqualTo("Quiet Free Studio");
        assertThat(result.tieBreakApplied()).isFalse();
        assertThat(result.rankedCandidates().get(0).components())
                .extracting(PlaceRecommendationScoringService.ScoreComponent::code)
                .containsExactly("DISTANCE", "MISSION_CATEGORY_FIT", "PRICE_ACCESSIBILITY", "QUIET_PREFERENCE", "DATA_SOURCE");
    }

    @Test
    void selectTopPlace_randomTieBreakOnlyWhenTopScoresTie() {
        Place firstTopCandidate = place(
                "Top Candidate A",
                37.5000,
                127.0000,
                MissionCategory.RELAX,
                null,
                true,
                DataSource.MANUAL,
                null
        );
        Place secondTopCandidate = place(
                "Top Candidate B",
                37.5000,
                127.0000,
                MissionCategory.RELAX,
                null,
                true,
                DataSource.MANUAL,
                null
        );
        Place lowerCandidate = place(
                "Lower Candidate",
                37.5300,
                127.0300,
                MissionCategory.CULTURE,
                null,
                false,
                DataSource.LIBRARY,
                30000
        );

        PlaceRecommendationScoringService.PlaceSelectionResult result = scoringService.selectTopPlace(
                List.of(firstTopCandidate, secondTopCandidate, lowerCandidate),
                new PlaceRecommendationScoringService.PlaceRankingContext(
                        MissionCategory.RELAX,
                        null,
                        37.5000,
                        127.0000,
                        10,
                        EnvironmentContext.fromSimulation(
                                LocalDate.now().atStartOfDay(),
                                37.5000,
                                127.0000,
                                10,
                                Weather.SUNNY,
                                18.0,
                                AirQuality.GOOD,
                                Congestion.NORMAL,
                                "E",
                                null
                        ),
                        null
                )
        );

        assertThat(result.tieBreakApplied()).isTrue();
        assertThat(result.tieCandidateCount()).isEqualTo(2);
        assertThat(result.selected().place().getName())
                .isIn("Top Candidate A", "Top Candidate B");
        assertThat(result.rankedCandidates().get(0).totalScore())
                .isEqualTo(result.rankedCandidates().get(1).totalScore());
        assertThat(result.rankedCandidates().get(1).totalScore())
                .isGreaterThan(result.rankedCandidates().get(2).totalScore());
    }

    @Test
    void rankPlaces_adjustsLibraryScoreForHighCongestionIntrovertContext() {
        Place quietLibrary = place(
                "Quiet Library",
                37.5000,
                127.0000,
                MissionCategory.CULTURE,
                "QUIET",
                true,
                DataSource.LIBRARY,
                null
        );
        Place generalCulturePlace = place(
                "General Culture Hall",
                37.5000,
                127.0000,
                MissionCategory.CULTURE,
                null,
                true,
                DataSource.SEOUL_CULTURE,
                null
        );

        List<PlaceRecommendationScoringService.PlaceScore> ranked = scoringService.rankPlaces(
                List.of(generalCulturePlace, quietLibrary),
                new PlaceRecommendationScoringService.PlaceRankingContext(
                        MissionCategory.CULTURE,
                        null,
                        37.5000,
                        127.0000,
                        10,
                        EnvironmentContext.fromSimulation(
                                LocalDate.now().atStartOfDay(),
                                37.5000,
                                127.0000,
                                10,
                                Weather.CLOUDY,
                                18.0,
                                AirQuality.GOOD,
                                Congestion.HIGH,
                                "I",
                                null
                        ),
                        null
                )
        );

        PlaceRecommendationScoringService.PlaceScore libraryScore = ranked.stream()
                .filter(score -> "Quiet Library".equals(score.place().getName()))
                .findFirst()
                .orElseThrow();

        assertThat(libraryScore.components())
                .filteredOn(component -> "DATA_SOURCE".equals(component.code()))
                .singleElement()
                .extracting(PlaceRecommendationScoringService.ScoreComponent::detail)
                .asString()
                .contains("HIGH + I");
    }

    @Test
    void rankPlaces_appliesPreferenceProfileToCategoryAndSourceScores() {
        Place preferredPlace = place(
                "Preferred Library",
                37.5000,
                127.0000,
                MissionCategory.RELAX,
                "QUIET",
                true,
                DataSource.LIBRARY,
                null
        );
        Place discouragedPlace = place(
                "Discouraged Park",
                37.5000,
                127.0000,
                MissionCategory.FOOD,
                null,
                true,
                DataSource.SEOUL_PARK,
                null
        );

        RecommendationPreferenceService.UserPreferenceProfile preferenceProfile =
                new RecommendationPreferenceService.UserPreferenceProfile(
                        Map.of(
                                MissionCategory.FOOD, 0.5,
                                MissionCategory.ACTIVITY, 1.0,
                                MissionCategory.RELAX, 1.4,
                                MissionCategory.CULTURE, 1.0
                        ),
                        Map.of(
                                DataSource.LIBRARY, 1.3,
                                DataSource.SEOUL_PARK, 0.7,
                                DataSource.KOPIS, 1.0,
                                DataSource.SEOUL_CULTURE, 1.0,
                                DataSource.SEOUL_RESERVATION, 1.0,
                                DataSource.SEOUL_RESTAURANT, 1.0,
                                DataSource.MANUAL, 1.0
                        ),
                        List.of()
                );

        List<PlaceRecommendationScoringService.PlaceScore> ranked = scoringService.rankPlaces(
                List.of(discouragedPlace, preferredPlace),
                new PlaceRecommendationScoringService.PlaceRankingContext(
                        MissionCategory.RELAX,
                        null,
                        37.5000,
                        127.0000,
                        10,
                        null,
                        preferenceProfile
                )
        );

        assertThat(ranked.get(0).place().getName()).isEqualTo("Preferred Library");
        assertThat(ranked.get(0).components())
                .filteredOn(component -> "DATA_SOURCE".equals(component.code()))
                .singleElement()
                .extracting(PlaceRecommendationScoringService.ScoreComponent::detail)
                .asString()
                .contains("preferenceWeight=1.3");
    }

    private Place place(String name,
                        double latitude,
                        double longitude,
                        MissionCategory category,
                        String tags,
                        boolean isFree,
                        DataSource dataSource,
                        Integer ticketPrice) {
        Place place = Place.builder()
                .name(name)
                .address(name + " address")
                .url("https://example.com/" + name.replace(' ', '-'))
                .latitude(latitude)
                .longitude(longitude)
                .category(category)
                .tags(tags)
                .isFree(isFree)
                .dataSource(dataSource)
                .isActive(true)
                .build();

        if (ticketPrice != null) {
            place.setPerformanceDetail(PlaceDetailPerformance.builder()
                    .startDate(LocalDate.now().minusDays(1))
                    .endDate(LocalDate.now().plusDays(7))
                    .ticketPrice(ticketPrice)
                    .performanceState("RUNNING")
                    .build());
        }

        return place;
    }
}
