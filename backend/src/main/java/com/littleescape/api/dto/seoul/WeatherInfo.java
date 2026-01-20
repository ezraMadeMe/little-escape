package com.littleescape.api.dto.seoul;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * 서울시 실시간 도시데이터 - 날씨 정보
 *
 * API 응답 필드:
 * - WEATHER_TIME: 측정 시간
 * - TEMP: 기온 (°C)
 * - RAINFALL: 강수량 (mm/h)
 * - SKY_STTS: 하늘 상태 (맑음, 구름조금, 흐림 등)
 * - SENSIBLE_TEMP: 체감온도 (°C)
 * - WIND_DIRCT: 풍향
 * - WIND_SPD: 풍속 (m/s)
 * - HUMIDITY: 습도 (%)
 * - UV_INDEX_LVL: 자외선 지수 레벨
 * - PM25: 초미세먼지 농도 (μg/m³)
 * - PM10: 미세먼지 농도 (μg/m³)
 */
public record WeatherInfo(
    @JsonProperty("WEATHER_TIME")
    String weatherTime,

    @JsonProperty("TEMP")
    String temperature,

    @JsonProperty("RAINFALL")
    String rainfall,

    @JsonProperty("SKY_STTS")
    String skyStatus,

    @JsonProperty("SENSIBLE_TEMP")
    String sensibleTemp,

    @JsonProperty("WIND_DIRCT")
    String windDirection,

    @JsonProperty("WIND_SPD")
    String windSpeed,

    @JsonProperty("HUMIDITY")
    String humidity,

    @JsonProperty("UV_INDEX_LVL")
    String uvIndexLevel,

    @JsonProperty("PM25")
    String pm25,

    @JsonProperty("PM10")
    String pm10
) {
    /**
     * 비가 오는지 확인
     *
     * @return 강수량이 0보다 크면 true
     */
    public boolean isRainy() {
        if (rainfall == null || rainfall.isEmpty()) {
            return false;
        }
        try {
            double rainfallValue = Double.parseDouble(rainfall);
            return rainfallValue > 0;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * 맑은 날씨인지 확인
     *
     * @return 하늘 상태가 "맑음"이면 true
     */
    public boolean isClear() {
        return skyStatus != null && skyStatus.contains("맑음");
    }

    /**
     * 흐린 날씨인지 확인
     *
     * @return 하늘 상태가 "흐림"이면 true
     */
    public boolean isCloudy() {
        return skyStatus != null && skyStatus.contains("흐림");
    }

    /**
     * 기온을 Double로 변환
     *
     * @return 기온 값, 파싱 실패 시 null
     */
    public Double getTemperatureAsDouble() {
        if (temperature == null || temperature.isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(temperature);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
