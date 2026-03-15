package com.littleescape.api.service.simulation;

import com.littleescape.api.domain.type.AirQuality;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.domain.type.RecommendationRadiusPolicy;
import com.littleescape.api.domain.type.Weather;
import lombok.Builder;
import lombok.Getter;

import java.time.DayOfWeek;
import java.time.LocalDateTime;

@Getter
@Builder
public class EnvironmentContext {

    public static final int DEFAULT_REALTIME_SEARCH_RADIUS_KM = RecommendationRadiusPolicy.DEFAULT_SEARCH_RADIUS_KM;
    public static final Weather DEFAULT_REALTIME_WEATHER = Weather.SUNNY;
    public static final double DEFAULT_REALTIME_TEMPERATURE_C = 20.0;
    public static final AirQuality DEFAULT_REALTIME_AIR_QUALITY = AirQuality.GOOD;
    public static final Congestion DEFAULT_REALTIME_CONGESTION = Congestion.NORMAL;

    private LocalDateTime targetDateTime;
    private DayOfWeek dayOfWeek;
    private int hour;

    private Double latitude;
    private Double longitude;
    private Integer searchRadius;

    private Weather weather;
    private Double temperature;
    private AirQuality airQuality;

    private Congestion congestion;

    private String userMbti;
    private String userTags;

    public static int resolveSearchRadius(Integer searchRadius) {
        return RecommendationRadiusPolicy.resolveSearchRadius(searchRadius);
    }

    public static EnvironmentContext fromRealTime(
            LocalDateTime targetDateTime,
            Double latitude,
            Double longitude,
            Integer searchRadius,
            Weather weather,
            Double temperature,
            AirQuality airQuality,
            Congestion congestion,
            String userMbti,
            String userTags
    ) {
        LocalDateTime effectiveDateTime = targetDateTime != null ? targetDateTime : LocalDateTime.now();

        return EnvironmentContext.builder()
                .targetDateTime(effectiveDateTime)
                .dayOfWeek(effectiveDateTime.getDayOfWeek())
                .hour(effectiveDateTime.getHour())
                .latitude(latitude)
                .longitude(longitude)
                .searchRadius(resolveSearchRadius(searchRadius))
                .weather(weather != null ? weather : DEFAULT_REALTIME_WEATHER)
                .temperature(temperature != null ? temperature : DEFAULT_REALTIME_TEMPERATURE_C)
                .airQuality(airQuality != null ? airQuality : DEFAULT_REALTIME_AIR_QUALITY)
                .congestion(congestion != null ? congestion : DEFAULT_REALTIME_CONGESTION)
                .userMbti(userMbti)
                .userTags(userTags)
                .build();
    }

    public static EnvironmentContext fromRealTime(
            Double latitude,
            Double longitude,
            String userMbti,
            String userTags
    ) {
        return fromRealTime(
                LocalDateTime.now(),
                latitude,
                longitude,
                DEFAULT_REALTIME_SEARCH_RADIUS_KM,
                DEFAULT_REALTIME_WEATHER,
                DEFAULT_REALTIME_TEMPERATURE_C,
                DEFAULT_REALTIME_AIR_QUALITY,
                DEFAULT_REALTIME_CONGESTION,
                userMbti,
                userTags
        );
    }

    public static EnvironmentContext fromSimulation(
            LocalDateTime targetDateTime,
            Double latitude,
            Double longitude,
            Integer searchRadius,
            Weather weather,
            Double temperature,
            AirQuality airQuality,
            Congestion congestion,
            String userMbti,
            String userTags
    ) {
        return EnvironmentContext.builder()
                .targetDateTime(targetDateTime)
                .dayOfWeek(targetDateTime.getDayOfWeek())
                .hour(targetDateTime.getHour())
                .latitude(latitude)
                .longitude(longitude)
                .searchRadius(resolveSearchRadius(searchRadius))
                .weather(weather)
                .temperature(temperature)
                .airQuality(airQuality)
                .congestion(congestion)
                .userMbti(userMbti)
                .userTags(userTags)
                .build();
    }

    public boolean isOutdoorRestricted() {
        return weather == Weather.RAIN
                || weather == Weather.SNOW
                || airQuality == AirQuality.WORST
                || (temperature != null && temperature < -5.0)
                || (temperature != null && temperature > 30.0);
    }

    public boolean isIndoorPreferred() {
        return weather == Weather.RAIN
                || weather == Weather.SNOW
                || airQuality == AirQuality.BAD
                || airQuality == AirQuality.WORST;
    }

    public boolean prefersQuietPlace() {
        return congestion == Congestion.HIGH;
    }

    public boolean isMonday() {
        return dayOfWeek == DayOfWeek.MONDAY;
    }

    public boolean isLateNight() {
        return hour >= 22;
    }

    public boolean hasUserTags() {
        return userTags != null && !userTags.isBlank();
    }

    public boolean isIntrovert() {
        return userMbti != null && userMbti.toUpperCase().startsWith("I");
    }

    public boolean isExtrovert() {
        return userMbti != null && userMbti.toUpperCase().startsWith("E");
    }
}
