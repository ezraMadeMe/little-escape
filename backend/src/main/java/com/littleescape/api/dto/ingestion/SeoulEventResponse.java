package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 서울시 열린데이터 광장 API JSON 응답 매핑 DTO
 * API: http://openapi.seoul.go.kr:8088/{KEY}/json/culturalEventInfo/1/100/
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SeoulEventResponse {

    @JsonProperty("culturalEventInfo")
    private CulturalEventInfo culturalEventInfo;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CulturalEventInfo {
        
        @JsonProperty("list_total_count")
        private Integer totalCount;
        
        @JsonProperty("RESULT")
        private Result result;
        
        @JsonProperty("row")
        private List<Event> events;
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
    public static class Event {
        
        @JsonProperty("CODENAME")
        private String codeName;  // 분류 (공연/전시 등)
        
        @JsonProperty("GUNAME")
        private String guName;  // 자치구
        
        @JsonProperty("TITLE")
        private String title;  // 행사명
        
        @JsonProperty("DATE")
        private String date;  // 날짜
        
        @JsonProperty("PLACE")
        private String place;  // 장소
        
        @JsonProperty("ORG_NAME")
        private String orgName;  // 기관명
        
        @JsonProperty("USE_TRGT")
        private String useTarget;  // 이용 대상
        
        @JsonProperty("USE_FEE")
        private String useFee;  // 이용 요금
        
        @JsonProperty("PLAYER")
        private String player;  // 출연자 정보
        
        @JsonProperty("PROGRAM")
        private String program;  // 프로그램 소개
        
        @JsonProperty("ETC_DESC")
        private String etcDesc;  // 기타 내용
        
        @JsonProperty("ORG_LINK")
        private String orgLink;  // 홈페이지 주소
        
        @JsonProperty("MAIN_IMG")
        private String mainImg;  // 대표 이미지
        
        @JsonProperty("RGSTDATE")
        private String registerDate;  // 등록일
        
        @JsonProperty("TICKET")
        private String ticket;  // 시민/기관 구분
        
        @JsonProperty("STRTDATE")
        private String startDate;  // 시작일
        
        @JsonProperty("END_DATE")
        private String endDate;  // 종료일
        
        @JsonProperty("THEMECODE")
        private String themeCode;  // 테마 분류
        
        @JsonProperty("LOT")
        private String longitude;  // 경도 (X좌표)
        
        @JsonProperty("LAT")
        private String latitude;  // 위도 (Y좌표)
        
        @JsonProperty("IS_FREE")
        private String isFree;  // 무료 유무
        
        @JsonProperty("HMPG_ADDR")
        private String homepageAddr;  // 홈페이지 주소
    }
}





