package com.littleescape.api.dto.seoul;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.littleescape.api.domain.type.CongestionLevel;

/**
 * 서울시 실시간 도시데이터 API 응답 DTO
 *
 * API 문서: https://data.seoul.go.kr/dataList/OA-21285/F/1/datasetView.do
 *
 * 주요 정보:
 * 1. 장소 정보 (POI_NM, AREA_NM)
 * 2. 혼잡도 정보 (AREA_CONGEST_LVL, AREA_CONGEST_MSG)
 * 3. 실시간 인구 정보 (AREA_PPLTN_MIN, AREA_PPLTN_MAX)
 * 4. 날씨 정보 (WeatherInfo)
 * 5. 위치 좌표 (X_COORD, Y_COORD)
 *
 * API URL 형식:
 * http://openapi.seoul.go.kr:8088/{인증키}/json/citydata/{장소코드}
 *
 * 예시:
 * http://openapi.seoul.go.kr:8088/sample/json/citydata/POI000001
 */
public record SeoulCityDataResponse(
    @JsonProperty("RESULT")
    Result result,

    @JsonProperty("CITYDATA")
    CityData cityData
) {
    /**
     * API 호출 결과
     */
    public record Result(
        @JsonProperty("CODE")
        String code,

        @JsonProperty("MESSAGE")
        String message
    ) {
        public boolean isSuccess() {
            return "INFO-000".equals(code);
        }
    }

    /**
     * 도시 데이터 메인 정보
     */
    public record CityData(
        // 장소 정보
        @JsonProperty("POI_ID")
        String poiId,

        @JsonProperty("POI_NM")
        String poiName,

        @JsonProperty("AREA_NM")
        String areaName,

        @JsonProperty("AREA_CD")
        String areaCode,

        // 혼잡도 정보
        @JsonProperty("AREA_CONGEST_LVL")
        String areaCongestionLevel,

        @JsonProperty("AREA_CONGEST_MSG")
        String areaCongestionMessage,

        // 실시간 인구 정보
        @JsonProperty("AREA_PPLTN_MIN")
        String areaPpltnMin,

        @JsonProperty("AREA_PPLTN_MAX")
        String areaPpltnMax,

        // 남성/여성 비율
        @JsonProperty("MALE_PPLTN_RATE")
        String malePpltnRate,

        @JsonProperty("FEMALE_PPLTN_RATE")
        String femalePpltnRate,

        // 연령대별 비율
        @JsonProperty("PPLTN_RATE_0")
        String ppltnRate0,  // 10대

        @JsonProperty("PPLTN_RATE_10")
        String ppltnRate10,  // 20대

        @JsonProperty("PPLTN_RATE_20")
        String ppltnRate20,  // 30대

        @JsonProperty("PPLTN_RATE_30")
        String ppltnRate30,  // 40대

        @JsonProperty("PPLTN_RATE_40")
        String ppltnRate40,  // 50대

        @JsonProperty("PPLTN_RATE_50")
        String ppltnRate50,  // 60대

        @JsonProperty("PPLTN_RATE_60")
        String ppltnRate60,  // 70대

        @JsonProperty("PPLTN_RATE_70")
        String ppltnRate70,  // 80대 이상

        // 거주/비거주 비율
        @JsonProperty("RESNT_PPLTN_RATE")
        String resntPpltnRate,  // 거주 인구 비율

        @JsonProperty("NON_RESNT_PPLTN_RATE")
        String nonResntPpltnRate,  // 비거주 인구 비율

        // 예보 메시지
        @JsonProperty("FCST_YN")
        String fcstYn,  // 예보 제공 여부

        @JsonProperty("FCST_PPLTN")
        ForecastPopulation[] fcstPpltn,  // 인구 예보

        // 날씨 정보
        @JsonProperty("LIVE_PPLTN_STTS")
        LivePopulationStatus[] livePpltnStts,  // 실시간 인구 현황

        @JsonProperty("WEATHER_STTS")
        WeatherInfo[] weatherStts,  // 날씨 현황

        // 위치 정보
        @JsonProperty("X_COORD")
        String xCoord,  // 경도 (WGS84)

        @JsonProperty("Y_COORD")
        String yCoord,  // 위도 (WGS84)

        // 업데이트 시간
        @JsonProperty("PPLTN_TIME")
        String ppltnTime
    ) {
        /**
         * 혼잡도 레벨을 Enum으로 변환
         *
         * @return CongestionLevel enum, 파싱 실패 시 NORMAL
         */
        public CongestionLevel getCongestionLevelEnum() {
            if (areaCongestionLevel == null || areaCongestionLevel.isEmpty()) {
                return CongestionLevel.NORMAL;
            }
            try {
                // API는 "여유", "보통", "약간 붐빔", "붐빔", "매우 붐빔" 형태로 반환
                return switch (areaCongestionLevel) {
                    case "여유" -> CongestionLevel.SMOOTH;
                    case "보통" -> CongestionLevel.NORMAL;
                    case "약간 붐빔" -> CongestionLevel.SLIGHTLY_CROWDED;
                    case "붐빔" -> CongestionLevel.CROWDED;
                    case "매우 붐빔" -> CongestionLevel.VERY_CROWDED;
                    default -> CongestionLevel.NORMAL;
                };
            } catch (Exception e) {
                return CongestionLevel.NORMAL;
            }
        }

        /**
         * 위도를 Double로 변환
         *
         * @return 위도 값, 파싱 실패 시 null
         */
        public Double getLatitude() {
            if (yCoord == null || yCoord.isEmpty()) {
                return null;
            }
            try {
                return Double.parseDouble(yCoord);
            } catch (NumberFormatException e) {
                return null;
            }
        }

        /**
         * 경도를 Double로 변환
         *
         * @return 경도 값, 파싱 실패 시 null
         */
        public Double getLongitude() {
            if (xCoord == null || xCoord.isEmpty()) {
                return null;
            }
            try {
                return Double.parseDouble(xCoord);
            } catch (NumberFormatException e) {
                return null;
            }
        }

        /**
         * 현재 날씨 정보 가져오기
         *
         * @return 첫 번째 WeatherInfo, 없으면 null
         */
        public WeatherInfo getCurrentWeather() {
            if (weatherStts == null || weatherStts.length == 0) {
                return null;
            }
            return weatherStts[0];
        }

        /**
         * 최소 인구수를 Integer로 변환
         *
         * @return 최소 인구수, 파싱 실패 시 null
         */
        public Integer getMinPopulation() {
            if (areaPpltnMin == null || areaPpltnMin.isEmpty()) {
                return null;
            }
            try {
                return Integer.parseInt(areaPpltnMin);
            } catch (NumberFormatException e) {
                return null;
            }
        }

        /**
         * 최대 인구수를 Integer로 변환
         *
         * @return 최대 인구수, 파싱 실패 시 null
         */
        public Integer getMaxPopulation() {
            if (areaPpltnMax == null || areaPpltnMax.isEmpty()) {
                return null;
            }
            try {
                return Integer.parseInt(areaPpltnMax);
            } catch (NumberFormatException e) {
                return null;
            }
        }
    }

    /**
     * 인구 예보 정보
     */
    public record ForecastPopulation(
        @JsonProperty("FCST_TIME")
        String fcstTime,

        @JsonProperty("FCST_CONGEST_LVL")
        String fcstCongestLevel,

        @JsonProperty("FCST_PPLTN_MIN")
        String fcstPpltnMin,

        @JsonProperty("FCST_PPLTN_MAX")
        String fcstPpltnMax
    ) {
    }

    /**
     * 실시간 인구 현황
     */
    public record LivePopulationStatus(
        @JsonProperty("PPLTN_TIME")
        String ppltnTime,

        @JsonProperty("PPLTN_MIN")
        String ppltnMin,

        @JsonProperty("PPLTN_MAX")
        String ppltnMax,

        @JsonProperty("MALE_PPLTN_RATE")
        String malePpltnRate,

        @JsonProperty("FEMALE_PPLTN_RATE")
        String femalePpltnRate
    ) {
    }
}
