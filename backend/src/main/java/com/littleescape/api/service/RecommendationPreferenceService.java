package com.littleescape.api.service;

import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.LikedAppointmentRepository;
import com.littleescape.api.repository.SavedAppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecommendationPreferenceService {

    private static final double DEFAULT_WEIGHT = 1.0;
    private static final double MIN_WEIGHT = 0.35;
    private static final double MAX_WEIGHT = 2.25;

    private final SavedAppointmentRepository savedAppointmentRepository;
    private final LikedAppointmentRepository likedAppointmentRepository;
    private final AppointmentRepository appointmentRepository;

    public UserPreferenceProfile buildProfile(Long userId) {
        Map<MissionCategory, Double> categoryWeights = new EnumMap<>(MissionCategory.class);
        for (MissionCategory category : MissionCategory.values()) {
            categoryWeights.put(category, DEFAULT_WEIGHT);
        }

        Map<DataSource, Double> dataSourceWeights = new EnumMap<>(DataSource.class);
        for (DataSource dataSource : DataSource.values()) {
            dataSourceWeights.put(dataSource, DEFAULT_WEIGHT);
        }

        List<PreferenceSignal> signals = new ArrayList<>();

        applyCategorySignal(
                categoryWeights,
                signals,
                "saved",
                savedAppointmentRepository.findCategoryStatsByUserId(userId),
                0.9,
                5.0,
                false
        );
        applyCategorySignal(
                categoryWeights,
                signals,
                "liked",
                likedAppointmentRepository.findCategoryStatsByUserId(userId),
                0.7,
                4.0,
                false
        );
        applyCategorySignal(
                categoryWeights,
                signals,
                "completed",
                appointmentRepository.findCategoryStatsByUserIdAndStatuses(
                        userId,
                        List.of(AppointmentStatus.COMPLETED)
                ),
                0.6,
                6.0,
                false
        );
        applyCategorySignal(
                categoryWeights,
                signals,
                "cancelled",
                appointmentRepository.findCategoryStatsByUserIdAndStatuses(
                        userId,
                        List.of(AppointmentStatus.CANCELLED)
                ),
                0.8,
                4.0,
                true
        );

        applyDataSourceSignal(
                dataSourceWeights,
                signals,
                "saved",
                savedAppointmentRepository.findPlaceDataSourceStatsByUserId(userId),
                0.35,
                4.0,
                false
        );
        applyDataSourceSignal(
                dataSourceWeights,
                signals,
                "liked",
                likedAppointmentRepository.findPlaceDataSourceStatsByUserId(userId),
                0.30,
                4.0,
                false
        );
        applyDataSourceSignal(
                dataSourceWeights,
                signals,
                "completed",
                appointmentRepository.findPlaceDataSourceStatsByUserIdAndStatuses(
                        userId,
                        List.of(AppointmentStatus.COMPLETED)
                ),
                0.25,
                5.0,
                false
        );
        applyDataSourceSignal(
                dataSourceWeights,
                signals,
                "cancelled",
                appointmentRepository.findPlaceDataSourceStatsByUserIdAndStatuses(
                        userId,
                        List.of(AppointmentStatus.CANCELLED)
                ),
                0.35,
                4.0,
                true
        );

        return new UserPreferenceProfile(
                Map.copyOf(categoryWeights),
                Map.copyOf(dataSourceWeights),
                List.copyOf(signals)
        );
    }

    private void applyCategorySignal(Map<MissionCategory, Double> weights,
                                     List<PreferenceSignal> signals,
                                     String signalType,
                                     List<Object[]> stats,
                                     double maxDelta,
                                     double fullConfidenceCount,
                                     boolean negative) {
        long totalCount = sumCounts(stats);
        if (totalCount == 0) {
            return;
        }

        double confidence = Math.min(1.0, totalCount / fullConfidenceCount);
        for (Object[] row : stats) {
            if (!(row[0] instanceof MissionCategory category) || !(row[1] instanceof Long count)) {
                continue;
            }

            double delta = signedDelta(maxDelta, count, totalCount, confidence, negative);
            weights.put(category, clampWeight(weights.get(category) + delta));
            signals.add(new PreferenceSignal(
                    "MISSION_CATEGORY",
                    signalType,
                    category.name(),
                    count,
                    totalCount,
                    round(delta)
            ));
        }
    }

    private void applyDataSourceSignal(Map<DataSource, Double> weights,
                                       List<PreferenceSignal> signals,
                                       String signalType,
                                       List<Object[]> stats,
                                       double maxDelta,
                                       double fullConfidenceCount,
                                       boolean negative) {
        long totalCount = sumCounts(stats);
        if (totalCount == 0) {
            return;
        }

        double confidence = Math.min(1.0, totalCount / fullConfidenceCount);
        for (Object[] row : stats) {
            if (!(row[1] instanceof Long count)) {
                continue;
            }

            DataSource dataSource = row[0] instanceof DataSource source ? source : DataSource.MANUAL;
            double delta = signedDelta(maxDelta, count, totalCount, confidence, negative);
            weights.put(dataSource, clampWeight(weights.get(dataSource) + delta));
            signals.add(new PreferenceSignal(
                    "DATA_SOURCE",
                    signalType,
                    dataSource.name(),
                    count,
                    totalCount,
                    round(delta)
            ));
        }
    }

    private double signedDelta(double maxDelta,
                               long count,
                               long totalCount,
                               double confidence,
                               boolean negative) {
        double share = (double) count / totalCount;
        double delta = maxDelta * share * confidence;
        return negative ? -delta : delta;
    }

    private long sumCounts(List<Object[]> stats) {
        return stats.stream()
                .map(row -> row[1])
                .filter(Long.class::isInstance)
                .map(Long.class::cast)
                .mapToLong(Long::longValue)
                .sum();
    }

    private double clampWeight(double value) {
        return round(Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, value)));
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public record PreferenceSignal(
            String targetType,
            String signalType,
            String key,
            long count,
            long totalCount,
            double delta
    ) {
    }

    public record UserPreferenceProfile(
            Map<MissionCategory, Double> categoryWeights,
            Map<DataSource, Double> dataSourceWeights,
            List<PreferenceSignal> signals
    ) {
        public double categoryWeight(MissionCategory category) {
            if (category == null) {
                return DEFAULT_WEIGHT;
            }
            return categoryWeights.getOrDefault(category, DEFAULT_WEIGHT);
        }

        public double dataSourceWeight(DataSource dataSource) {
            DataSource resolvedSource = dataSource != null ? dataSource : DataSource.MANUAL;
            return dataSourceWeights.getOrDefault(resolvedSource, DEFAULT_WEIGHT);
        }

        public boolean hasSignals() {
            return !signals.isEmpty();
        }
    }
}
