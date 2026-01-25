package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 서울시 주요 공원현황 API JSON 응답 매핑 DTO
 * API: http://openAPI.seoul.go.kr:8088/{KEY}/json/SearchParkInfoService/1/100/
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SeoulParkResponse {

    @JsonProperty("SearchParkInfoService")
    private SearchParkInfoService searchParkInfoService;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SearchParkInfoService {

        @JsonProperty("list_total_count")
        private Integer totalCount;

        @JsonProperty("RESULT")
        private Result result;

        @JsonProperty("row")
        private List<Park> parks;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {
        @JsonProperty("CODE")
        private String code;

        @JsonProperty("MESSAGE")
        private String message;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Park {

        /** 공원 인덱스 */
        @JsonProperty("P_IDX")
        private String idx;

        /** 공원명 */
        @JsonProperty("P_PARK")
        private String name;

        /** 공원 목록 설명 */
        @JsonProperty("P_LIST_CONTENT")
        private String listContent;

        /** 공원주소 */
        @JsonProperty("P_ADDR")
        private String address;

        /** 지역구 */
        @JsonProperty("P_ZONE")
        private String zone;

        /** 관리 전화번호 */
        @JsonProperty("P_ADMINTEL")
        private String adminTel;

        /** 공원 개요 */
        @JsonProperty("P_PARK_OTLN")
        private String outline;

        /** 공원 면적 */
        @JsonProperty("AREA")
        private String area;

        /** 주요 시설 */
        @JsonProperty("MAIN_EQUIP")
        private String mainEquip;

        /** 주요 식물 */
        @JsonProperty("MAIN_PLANTS")
        private String mainPlants;

        /** 이용시 참고사항 */
        @JsonProperty("GUIDANCE")
        private String guidance;

        /** 템플릿 URL */
        @JsonProperty("TEMPLATE_URL")
        private String templateUrl;

        /** 이미지 URL */
        @JsonProperty("P_IMG")
        private String imageUrl;

        /** 위도 */
        @JsonProperty("LATITUDE")
        private String latitude;

        /** 경도 */
        @JsonProperty("LONGITUDE")
        private String longitude;

        /** 구글맵 위도 */
        @JsonProperty("G_LATITUDE")
        private String gLatitude;

        /** 구글맵 경도 */
        @JsonProperty("G_LONGITUDE")
        private String gLongitude;

        // Alias getter for name (공원명)
        public String getParkName() {
            return name;
        }
    }

    /**
     * 공원 목록 반환 (null-safe)
     */
    public List<Park> getParks() {
        return searchParkInfoService != null ? searchParkInfoService.getParks() : null;
    }

    /**
     * 공원 목록이 비어있는지 확인
     */
    public boolean isEmpty() {
        return getParks() == null || getParks().isEmpty();
    }

    /**
     * 공원 개수 반환
     */
    public int getCount() {
        List<Park> parks = getParks();
        return parks != null ? parks.size() : 0;
    }

    /**
     * API 호출 성공 여부 확인
     */
    public boolean isSuccess() {
        return searchParkInfoService != null &&
               searchParkInfoService.getResult() != null &&
               "INFO-000".equals(searchParkInfoService.getResult().getCode());
    }
}
