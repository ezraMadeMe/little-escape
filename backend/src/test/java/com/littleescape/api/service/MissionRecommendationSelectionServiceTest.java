package com.littleescape.api.service;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.TimeOfDay;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class MissionRecommendationSelectionServiceTest {

    @Test
    void selectMission_prefersHigherCategoryWeightWhenRollIsLow() {
        MissionRecommendationSelectionService service =
                new MissionRecommendationSelectionService(() -> 0.05);

        MissionTemplate relaxMission = mission(1L, "Relax Mission", MissionCategory.RELAX);
        MissionTemplate foodMission = mission(2L, "Food Mission", MissionCategory.FOOD);

        RecommendationPreferenceService.UserPreferenceProfile profile =
                new RecommendationPreferenceService.UserPreferenceProfile(
                        Map.of(MissionCategory.RELAX, 2.0, MissionCategory.FOOD, 1.0),
                        Map.of(),
                        List.of()
                );

        MissionRecommendationSelectionService.MissionSelectionResult result = service.selectMission(
                List.of(foodMission, relaxMission),
                profile
        );

        assertThat(result.rankedCandidates())
                .extracting(candidate -> candidate.mission().getId())
                .containsExactly(1L, 2L);
        assertThat(result.selected().mission().getId()).isEqualTo(1L);
        assertThat(result.totalWeight()).isEqualTo(3.0);
    }

    @Test
    void selectMission_canSelectLowerWeightCandidateWhenRollFallsInItsRange() {
        MissionRecommendationSelectionService service =
                new MissionRecommendationSelectionService(() -> 0.95);

        MissionTemplate relaxMission = mission(1L, "Relax Mission", MissionCategory.RELAX);
        MissionTemplate foodMission = mission(2L, "Food Mission", MissionCategory.FOOD);

        RecommendationPreferenceService.UserPreferenceProfile profile =
                new RecommendationPreferenceService.UserPreferenceProfile(
                        Map.of(MissionCategory.RELAX, 2.0, MissionCategory.FOOD, 1.0),
                        Map.of(),
                        List.of()
                );

        MissionRecommendationSelectionService.MissionSelectionResult result = service.selectMission(
                List.of(foodMission, relaxMission),
                profile
        );

        assertThat(result.selected().mission().getId()).isEqualTo(2L);
        assertThat(result.selectedPoint()).isGreaterThan(2.0);
        assertThat(result.selectedPoint()).isLessThan(result.totalWeight());
    }

    private MissionTemplate mission(Long id, String title, MissionCategory category) {
        MissionTemplate mission = new MissionTemplate();
        mission.setId(id);
        mission.setTitle(title);
        mission.setDescription(title + " description");
        mission.setCategory(category);
        mission.setDifficultyLevel("MEDIUM");
        mission.setLocationType(LocationType.ANY);
        mission.setTimeOfDay(TimeOfDay.ANY);
        mission.setIsPlaceRequired(false);
        return mission;
    }
}
