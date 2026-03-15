package com.littleescape.api.service;

import com.littleescape.api.domain.SeoulCityPlace;
import com.littleescape.api.domain.type.AirQuality;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.domain.type.CongestionLevel;
import com.littleescape.api.domain.type.Weather;
import com.littleescape.api.service.simulation.EnvironmentContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RecommendationEnvironmentService {

    private static final int MAX_REALTIME_CACHE_AGE_MINUTES = 90;
    private static final int PM25_BAD_THRESHOLD = 35;
    private static final int PM25_WORST_THRESHOLD = 75;
    private static final int PM10_BAD_THRESHOLD = 80;
    private static final int PM10_WORST_THRESHOLD = 150;

    private final SeoulCityPlaceCacheService seoulCityPlaceCacheService;

    public EnvironmentContext buildRealTimeContext(
            LocalDateTime targetDateTime,
            Double latitude,
            Double longitude,
            Integer searchRadius,
            String userMbti,
            String userTags
    ) {
        RealTimeEnvironmentSnapshot snapshot = resolveSnapshot(latitude, longitude);

        return EnvironmentContext.fromRealTime(
                targetDateTime,
                latitude,
                longitude,
                searchRadius,
                snapshot.weather(),
                snapshot.temperature(),
                snapshot.airQuality(),
                snapshot.congestion(),
                userMbti,
                userTags
        );
    }

    public EnvironmentContext buildRealTimeContext(
            LocalDateTime targetDateTime,
            Double latitude,
            Double longitude,
            String userMbti,
            String userTags
    ) {
        return buildRealTimeContext(targetDateTime, latitude, longitude, null, userMbti, userTags);
    }

    public RealTimeEnvironmentSnapshot resolveSnapshot(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return fallbackSnapshot("fallback:no_coordinates");
        }

        return seoulCityPlaceCacheService.getNearestPlace(latitude, longitude)
                .filter(place -> place.isFresh(MAX_REALTIME_CACHE_AGE_MINUTES))
                .map(this::snapshotFromPlace)
                .orElseGet(() -> fallbackSnapshot("fallback:no_fresh_city_data"));
    }

    private RealTimeEnvironmentSnapshot snapshotFromPlace(SeoulCityPlace place) {
        return new RealTimeEnvironmentSnapshot(
                mapWeather(place),
                place.getTemperature() != null
                        ? place.getTemperature()
                        : EnvironmentContext.DEFAULT_REALTIME_TEMPERATURE_C,
                mapAirQuality(place),
                mapCongestion(place.getCongestionLevel()),
                "seoul_city_cache:" + place.getPlaceName()
        );
    }

    private RealTimeEnvironmentSnapshot fallbackSnapshot(String source) {
        return new RealTimeEnvironmentSnapshot(
                EnvironmentContext.DEFAULT_REALTIME_WEATHER,
                EnvironmentContext.DEFAULT_REALTIME_TEMPERATURE_C,
                EnvironmentContext.DEFAULT_REALTIME_AIR_QUALITY,
                EnvironmentContext.DEFAULT_REALTIME_CONGESTION,
                source
        );
    }

    private Weather mapWeather(SeoulCityPlace place) {
        if (place.isSnowy()) {
            return Weather.SNOW;
        }
        if (place.isRainy()) {
            return Weather.RAIN;
        }
        if (place.isClearWeather()) {
            return Weather.SUNNY;
        }
        return Weather.CLOUDY;
    }

    private AirQuality mapAirQuality(SeoulCityPlace place) {
        Integer pm25 = place.getPm25();
        Integer pm10 = place.getPm10();

        if ((pm25 != null && pm25 > PM25_WORST_THRESHOLD)
                || (pm10 != null && pm10 > PM10_WORST_THRESHOLD)) {
            return AirQuality.WORST;
        }

        if ((pm25 != null && pm25 > PM25_BAD_THRESHOLD)
                || (pm10 != null && pm10 > PM10_BAD_THRESHOLD)) {
            return AirQuality.BAD;
        }

        return EnvironmentContext.DEFAULT_REALTIME_AIR_QUALITY;
    }

    private Congestion mapCongestion(CongestionLevel congestionLevel) {
        if (congestionLevel == null) {
            return EnvironmentContext.DEFAULT_REALTIME_CONGESTION;
        }

        return switch (congestionLevel) {
            case SMOOTH -> Congestion.LOW;
            case NORMAL, SLIGHTLY_CROWDED -> Congestion.NORMAL;
            case CROWDED, VERY_CROWDED -> Congestion.HIGH;
        };
    }

    public record RealTimeEnvironmentSnapshot(
            Weather weather,
            Double temperature,
            AirQuality airQuality,
            Congestion congestion,
            String source
    ) {
    }
}
