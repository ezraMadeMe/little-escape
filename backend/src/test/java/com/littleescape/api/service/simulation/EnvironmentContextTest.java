package com.littleescape.api.service.simulation;

import com.littleescape.api.domain.type.AirQuality;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.domain.type.RecommendationRadiusPolicy;
import com.littleescape.api.domain.type.Weather;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EnvironmentContextTest {

    @Test
    void fromRealTime_usesSharedDefaultRadiusWhenMissing() {
        EnvironmentContext context = EnvironmentContext.fromRealTime(
                LocalDateTime.of(2025, 1, 20, 14, 30),
                37.5665,
                126.9780,
                null,
                Weather.SUNNY,
                20.0,
                AirQuality.GOOD,
                Congestion.NORMAL,
                "I",
                null
        );

        assertThat(context.getSearchRadius()).isEqualTo(RecommendationRadiusPolicy.DEFAULT_SEARCH_RADIUS_KM);
    }

    @Test
    void fromSimulation_normalizesInvalidRadiusWithSameRule() {
        EnvironmentContext context = EnvironmentContext.fromSimulation(
                LocalDateTime.of(2025, 1, 20, 14, 30),
                37.5665,
                126.9780,
                0,
                Weather.CLOUDY,
                18.0,
                AirQuality.BAD,
                Congestion.HIGH,
                "E",
                "NO_ALCOHOL"
        );

        assertThat(context.getSearchRadius()).isEqualTo(RecommendationRadiusPolicy.DEFAULT_SEARCH_RADIUS_KM);
    }
}
