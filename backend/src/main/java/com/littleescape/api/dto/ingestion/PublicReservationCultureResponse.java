package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 서울시 문화행사 공공서비스예약 API JSON 응답 매핑 DTO
 * API: http://openapi.seoul.go.kr:8088/{KEY}/json/ListPublicReservationCulture/1/100/
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class PublicReservationCultureResponse {

    @JsonProperty("ListPublicReservationCulture")
    private ListData listData;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ListData {

        @JsonProperty("list_total_count")
        private Integer totalCount;

        @JsonProperty("RESULT")
        private Result result;

        @JsonProperty("row")
        private List<CultureEvent> events;
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
    public static class CultureEvent {

        /** 서비스 ID */
        @JsonProperty("SVCID")
        private String serviceId;

        /** 최대 분류명 (대분류) */
        @JsonProperty("MAXCLASSNM")
        private String maxClassName;

        /** 최소 분류명 (소분류) */
        @JsonProperty("MINCLASSNM")
        private String minClassName;

        /** 서비스 상태명 */
        @JsonProperty("SVCSTATNM")
        private String serviceStatusName;

        /** 서비스명 */
        @JsonProperty("SVCNM")
        private String serviceName;

        /** 결제 방법 (유료/무료) */
        @JsonProperty("PAYATNM")
        private String payType;

        /** 장소명 */
        @JsonProperty("PLACENM")
        private String placeName;

        /** 이용 대상 */
        @JsonProperty("USETGTINFO")
        private String targetInfo;

        /** 서비스 URL */
        @JsonProperty("SVCURL")
        private String serviceUrl;

        /** 서비스 개시 시작일시 */
        @JsonProperty("SVCOPNBGNDT")
        private String openBeginDate;

        /** 서비스 개시 종료일시 */
        @JsonProperty("SVCOPNENDDT")
        private String openEndDate;

        /** 접수 시작일시 */
        @JsonProperty("RCPTBGNDT")
        private String registerBeginDate;

        /** 접수 종료일시 */
        @JsonProperty("RCPTENDDT")
        private String registerEndDate;

        /** 지역명 */
        @JsonProperty("AREANM")
        private String areaName;

        /** 이미지 URL */
        @JsonProperty("IMGURL")
        private String imageUrl;

        /** 상세 내용 */
        @JsonProperty("DTLCONT")
        private String detailContent;

        /** 전화번호 */
        @JsonProperty("TELNO")
        private String telNo;

        /** V_최소 연령 */
        @JsonProperty("V_MIN")
        private String minAge;

        /** V_최대 연령 */
        @JsonProperty("V_MAX")
        private String maxAge;

        /** 취소 기준일명 */
        @JsonProperty("REVSTDDAYNM")
        private String cancelStandardDayName;

        /** X 좌표 (경도) */
        @JsonProperty("X")
        private String longitude;

        /** Y 좌표 (위도) */
        @JsonProperty("Y")
        private String latitude;

        /** 서비스 이용 시작시간 */
        @JsonProperty("V_STIME")
        private String startTime;

        /** 서비스 이용 종료시간 */
        @JsonProperty("V_ETIME")
        private String endTime;
    }

    /**
     * 이벤트 목록 반환 (null-safe)
     */
    public List<CultureEvent> getEvents() {
        return listData != null ? listData.getEvents() : null;
    }

    /**
     * 이벤트 목록이 비어있는지 확인
     */
    public boolean isEmpty() {
        return getEvents() == null || getEvents().isEmpty();
    }

    /**
     * 이벤트 개수 반환
     */
    public int getCount() {
        List<CultureEvent> events = getEvents();
        return events != null ? events.size() : 0;
    }

    /**
     * API 호출 성공 여부 확인
     */
    public boolean isSuccess() {
        return listData != null &&
               listData.getResult() != null &&
               "INFO-000".equals(listData.getResult().getCode());
    }
}
