package com.littleescape.api.service;

import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.type.MissionCategory;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.DoubleSupplier;

@Service
public class MissionRecommendationSelectionService {

    private static final double DEFAULT_CATEGORY_WEIGHT = 1.0;
    private static final double MAX_RANDOM_FRACTION = Math.nextDown(1.0);

    private final DoubleSupplier randomSupplier;

    public MissionRecommendationSelectionService() {
        this(() -> ThreadLocalRandom.current().nextDouble());
    }

    MissionRecommendationSelectionService(DoubleSupplier randomSupplier) {
        this.randomSupplier = randomSupplier;
    }

    public MissionSelectionResult selectMission(
            List<MissionTemplate> candidates,
            RecommendationPreferenceService.UserPreferenceProfile preferenceProfile
    ) {
        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalArgumentException("Mission candidates must not be empty.");
        }

        List<MissionCandidateScore> rankedCandidates = candidates.stream()
                .map(mission -> new MissionCandidateScore(
                        mission,
                        resolveCategoryWeight(preferenceProfile, mission.getCategory())
                ))
                .sorted(Comparator
                        .comparingDouble(MissionCandidateScore::categoryWeight).reversed()
                        .thenComparing(candidate -> candidate.mission().getTitle(), Comparator.nullsLast(String::compareTo)))
                .toList();

        if (rankedCandidates.size() == 1) {
            MissionCandidateScore selected = rankedCandidates.get(0);
            return new MissionSelectionResult(
                    rankedCandidates,
                    selected,
                    selected.categoryWeight(),
                    0.0,
                    0.0
            );
        }

        double totalWeight = rankedCandidates.stream()
                .mapToDouble(MissionCandidateScore::categoryWeight)
                .sum();
        double randomFraction = normalizeRandomFraction(randomSupplier.getAsDouble());
        double selectedPoint = totalWeight * randomFraction;
        double cumulativeWeight = 0.0;

        for (MissionCandidateScore candidate : rankedCandidates) {
            cumulativeWeight += candidate.categoryWeight();
            if (selectedPoint <= cumulativeWeight) {
                return new MissionSelectionResult(
                        rankedCandidates,
                        candidate,
                        totalWeight,
                        selectedPoint,
                        randomFraction
                );
            }
        }

        MissionCandidateScore fallback = rankedCandidates.get(rankedCandidates.size() - 1);
        return new MissionSelectionResult(
                rankedCandidates,
                fallback,
                totalWeight,
                selectedPoint,
                randomFraction
        );
    }

    private double resolveCategoryWeight(
            RecommendationPreferenceService.UserPreferenceProfile preferenceProfile,
            MissionCategory category
    ) {
        if (preferenceProfile == null) {
            return DEFAULT_CATEGORY_WEIGHT;
        }
        return preferenceProfile.categoryWeight(category);
    }

    private double normalizeRandomFraction(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) {
            return 0.0;
        }
        return Math.max(0.0, Math.min(MAX_RANDOM_FRACTION, value));
    }

    public record MissionCandidateScore(
            MissionTemplate mission,
            double categoryWeight
    ) {
    }

    public record MissionSelectionResult(
            List<MissionCandidateScore> rankedCandidates,
            MissionCandidateScore selected,
            double totalWeight,
            double selectedPoint,
            double randomFraction
    ) {
    }
}
