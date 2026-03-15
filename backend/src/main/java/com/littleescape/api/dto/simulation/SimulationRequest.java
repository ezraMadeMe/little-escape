package com.littleescape.api.dto.simulation;

import com.littleescape.api.domain.type.AirQuality;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.RecommendationRadiusPolicy;
import com.littleescape.api.domain.type.Weather;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "Simulation request payload")
public record SimulationRequest(

    @Schema(description = "Simulation target date/time", example = "2025-01-20T14:30:00")
    LocalDateTime targetDateTime,

    @Schema(description = "User latitude", example = "37.5665")
    Double latitude,

    @Schema(description = "User longitude", example = "126.9780")
    Double longitude,

    @Schema(description = "Search radius in km", example = "10")
    Integer searchRadius,

    @Schema(description = "Weather", example = "SUNNY")
    Weather weather,

    @Schema(description = "Temperature in Celsius", example = "15.5")
    Double temperature,

    @Schema(description = "Air quality", example = "GOOD")
    AirQuality airQuality,

    @Schema(description = "Congestion level", example = "NORMAL")
    Congestion congestion,

    @Schema(description = "User MBTI (I or E)", example = "I")
    String userMbti,

    @Schema(description = "Optional user ID for loading saved/liked/completed preference signals", example = "12", nullable = true)
    Long userId,

    @Schema(
            description = "Comma-separated user constraint tags",
            example = "NO_ALCOHOL,HATE_WALKING",
            nullable = true
    )
    String userTags,

    @Schema(description = "Force mission category", example = "FOOD", nullable = true)
    MissionCategory forcedCategory
) {

    public SimulationRequest {
        if (targetDateTime == null) {
            targetDateTime = LocalDateTime.now();
        }
        searchRadius = RecommendationRadiusPolicy.resolveSearchRadius(searchRadius);
        if (weather == null) {
            weather = Weather.SUNNY;
        }
        if (temperature == null) {
            temperature = 20.0;
        }
        if (airQuality == null) {
            airQuality = AirQuality.GOOD;
        }
        if (congestion == null) {
            congestion = Congestion.NORMAL;
        }
        if (userTags != null && userTags.isBlank()) {
            userTags = null;
        }
    }
}
