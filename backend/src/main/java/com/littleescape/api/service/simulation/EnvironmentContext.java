package com.littleescape.api.service.simulation;

import com.littleescape.api.domain.type.AirQuality;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.domain.type.Weather;
import lombok.Builder;
import lombok.Getter;

import java.time.DayOfWeek;
import java.time.LocalDateTime;

/**
 * 환경 컨텍스트 - 실제 서비스와 시뮬레이션 모두에서 사용
 * 추천 로직에 필요한 모든 환경 변수를 캡슐화
 */
@Getter
@Builder
public class EnvironmentContext {

    // 시간 관련
    private LocalDateTime targetDateTime;
    private DayOfWeek dayOfWeek;
    private int hour;

    // 위치 관련
    private Double latitude;
    private Double longitude;
    private Integer searchRadius;

    // 날씨 관련
    private Weather weather;
    private Double temperature;
    private AirQuality airQuality;

    // 혼잡도
    private Congestion congestion;

    // 사용자 정보
    private String userMbti;
    private String userTags;

    /**
     * 실제 운영 환경 컨텍스트 생성 (현재 시간 기준)
     */
    public static EnvironmentContext fromRealTime(
            Double latitude,
            Double longitude,
            String userMbti,
            String userTags) {

        LocalDateTime now = LocalDateTime.now();

        return EnvironmentContext.builder()
                .targetDateTime(now)
                .dayOfWeek(now.getDayOfWeek())
                .hour(now.getHour())
                .latitude(latitude)
                .longitude(longitude)
                .searchRadius(10) // 기본 반경 10km
                .weather(Weather.SUNNY) // TODO: 실제 날씨 API 연동
                .temperature(20.0) // TODO: 실제 기온 데이터
                .airQuality(AirQuality.GOOD) // TODO: 실제 미세먼지 데이터
                .congestion(Congestion.LOW) // TODO: 실제 혼잡도 데이터
                .userMbti(userMbti)
                .userTags(userTags)
                .build();
    }

    /**
     * 시뮬레이션 환경 컨텍스트 생성 (모든 변수 통제)
     */
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
            String userTags) {

        return EnvironmentContext.builder()
                .targetDateTime(targetDateTime)
                .dayOfWeek(targetDateTime.getDayOfWeek())
                .hour(targetDateTime.getHour())
                .latitude(latitude)
                .longitude(longitude)
                .searchRadius(searchRadius)
                .weather(weather)
                .temperature(temperature)
                .airQuality(airQuality)
                .congestion(congestion)
                .userMbti(userMbti)
                .userTags(userTags)
                .build();
    }

    /**
     * 야외 활동 제한 여부 판단
     */
    public boolean isOutdoorRestricted() {
        // 비/눈이 오거나 미세먼지가 매우 나쁘거나 극한 기온
        return weather == Weather.RAIN
                || weather == Weather.SNOW
                || airQuality == AirQuality.WORST
                || temperature < -5.0
                || temperature > 30.0;
    }

    /**
     * 실내 활동 우선 여부 판단
     */
    public boolean isIndoorPreferred() {
        // 비/눈 또는 미세먼지 나쁨
        return weather == Weather.RAIN
                || weather == Weather.SNOW
                || airQuality == AirQuality.BAD
                || airQuality == AirQuality.WORST;
    }

    /**
     * 조용한 장소 선호 여부 (혼잡도 높을 때)
     */
    public boolean prefersQuietPlace() {
        return congestion == Congestion.HIGH;
    }

    /**
     * 월요일 여부 (도서관 휴무일)
     */
    public boolean isMonday() {
        return dayOfWeek == DayOfWeek.MONDAY;
    }

    /**
     * 야간 시간 여부 (22시 이후)
     */
    public boolean isLateNight() {
        return hour >= 22;
    }
}
