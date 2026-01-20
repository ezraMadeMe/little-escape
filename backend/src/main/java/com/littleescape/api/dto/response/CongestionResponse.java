package com.littleescape.api.dto.response;

import com.littleescape.api.domain.SeoulCityPlace;
import com.littleescape.api.domain.type.CongestionLevel;

import java.time.LocalDateTime;

/**
 * 실시간 혼잡도 조회 응답 DTO
 *
 * 프론트엔드에서 혼잡도 배지 표시를 위한 정보 포함:
 * - 혼잡도 레벨 (1~5)
 * - 한글 텍스트 ("여유", "보통", "혼잡" 등)
 * - 배지 색상 ("green", "yellow", "red")
 * - 현재 인구수
 * - 마지막 갱신 시각
 */
public record CongestionResponse(
        String placeCode,
        String placeName,
        String areaName,
        Double latitude,
        Double longitude,
        Integer congestionLevel,
        String congestionText,
        String badgeColor,
        Integer currentPopulation,
        String weatherCondition,
        Double temperature,
        LocalDateTime lastUpdated,
        Boolean isValid
) {

    /**
     * SeoulCityPlace 엔티티를 응답 DTO로 변환
     *
     * @param place 서울시 장소 엔티티
     * @return 혼잡도 응답 DTO
     */
    public static CongestionResponse from(SeoulCityPlace place) {
        CongestionLevel level = place.getCongestionLevel();

        return new CongestionResponse(
                place.getPlaceCode(),
                place.getPlaceName(),
                place.getAreaName(),
                place.getLatitude(),
                place.getLongitude(),
                getCongestionLevelNumber(level),
                getCongestionText(level),
                getBadgeColor(level),
                place.getAveragePopulation(),
                place.getWeatherCondition(),
                place.getTemperature(),
                place.getLastUpdated(),
                place.getIsValid()
        );
    }

    /**
     * 혼잡도 레벨을 숫자로 변환
     *
     * @param level 혼잡도 레벨
     * @return 1~5 숫자
     */
    private static Integer getCongestionLevelNumber(CongestionLevel level) {
        return switch (level) {
            case SMOOTH -> 1;
            case NORMAL -> 2;
            case SLIGHTLY_CROWDED -> 3;
            case CROWDED -> 4;
            case VERY_CROWDED -> 5;
        };
    }

    /**
     * 혼잡도 레벨을 한글 텍스트로 변환
     *
     * @param level 혼잡도 레벨
     * @return 한글 텍스트 ("여유", "보통", "약간 붐빔", "붐빔", "매우 붐빔")
     */
    private static String getCongestionText(CongestionLevel level) {
        return level.getDescription();
    }

    /**
     * 혼잡도 레벨에 따른 배지 색상
     *
     * 색상 매핑:
     * - 여유 (1): green
     * - 보통 (2): blue
     * - 약간 붐빔 (3): yellow
     * - 붐빔 (4): orange
     * - 매우 붐빔 (5): red
     *
     * @param level 혼잡도 레벨
     * @return CSS 색상 문자열
     */
    private static String getBadgeColor(CongestionLevel level) {
        return switch (level) {
            case SMOOTH -> "green";
            case NORMAL -> "blue";
            case SLIGHTLY_CROWDED -> "yellow";
            case CROWDED -> "orange";
            case VERY_CROWDED -> "red";
        };
    }
}
