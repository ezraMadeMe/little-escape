package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

/**
 * KOPIS 공연 상세 조회 API XML 응답 매핑 DTO
 * API: http://www.kopis.or.kr/openApi/restful/pblprfr/{mt20id}
 *
 * 공연 목록(KopisResponse)과 달리 상세 API에서만 제공되는 정보:
 * - 티켓 가격 (pcseguidance)
 * - 줄거리 (sty)
 * - 출연진/제작진
 * - 좌표 (la, lo)
 */
@Data
@JacksonXmlRootElement(localName = "dbs")
@JsonIgnoreProperties(ignoreUnknown = true)
public class PerformanceDetailResponse {

    @JacksonXmlProperty(localName = "db")
    private PerformanceDetail detail;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class PerformanceDetail {

        /** 공연 ID */
        @JacksonXmlProperty(localName = "mt20id")
        private String id;

        /** 공연명 */
        @JacksonXmlProperty(localName = "prfnm")
        private String name;

        /** 공연 시작일 (yyyyMMdd) */
        @JacksonXmlProperty(localName = "prfpdfrom")
        private String startDate;

        /** 공연 종료일 (yyyyMMdd) */
        @JacksonXmlProperty(localName = "prfpdto")
        private String endDate;

        /** 공연 시설명 (공연장) */
        @JacksonXmlProperty(localName = "fcltynm")
        private String facilityName;

        /** 출연진 */
        @JacksonXmlProperty(localName = "prfcast")
        private String cast;

        /** 제작진 */
        @JacksonXmlProperty(localName = "prfcrew")
        private String crew;

        /** 공연 런타임 */
        @JacksonXmlProperty(localName = "prfruntime")
        private String runtime;

        /** 관람 연령 */
        @JacksonXmlProperty(localName = "prfage")
        private String age;

        /** 제작사 */
        @JacksonXmlProperty(localName = "entrpsnm")
        private String company;

        /**
         * 티켓 가격
         * 예: "전석 50,000원", "R석 70,000원, S석 50,000원"
         */
        @JacksonXmlProperty(localName = "pcseguidance")
        private String ticketPrice;

        /** 포스터 URL */
        @JacksonXmlProperty(localName = "poster")
        private String posterUrl;

        /** 줄거리 */
        @JacksonXmlProperty(localName = "sty")
        private String synopsis;

        /** 장르명 */
        @JacksonXmlProperty(localName = "genrenm")
        private String genre;

        /** 공연 상태 (공연중, 공연예정, 공연완료) */
        @JacksonXmlProperty(localName = "prfstate")
        private String state;

        /** 오픈런 여부 (Y/N) */
        @JacksonXmlProperty(localName = "openrun")
        private String openRun;

        /** 공연 시간 안내 */
        @JacksonXmlProperty(localName = "dtguidance")
        private String timeGuide;

        /** 아동 관람 가능 여부 (Y/N) */
        @JacksonXmlProperty(localName = "kidstate")
        private String kidState;

        /** 위도 */
        @JacksonXmlProperty(localName = "la")
        private String latitude;

        /** 경도 */
        @JacksonXmlProperty(localName = "lo")
        private String longitude;

        /** 시설 ID */
        @JacksonXmlProperty(localName = "mt10id")
        private String facilityId;

        /** 지역 */
        @JacksonXmlProperty(localName = "area")
        private String area;

        /** 예매 URL 목록 */
        @JacksonXmlProperty(localName = "relates")
        private String relatesUrl;

        // Alias getter for ticketPrice
        public String getPriceInfo() {
            return ticketPrice;
        }
    }

    /**
     * 상세 정보 반환 (null-safe)
     */
    public PerformanceDetail getPerformanceDetail() {
        return detail;
    }

    /**
     * 티켓 가격 반환
     */
    public String getTicketPrice() {
        return detail != null ? detail.getTicketPrice() : null;
    }

    /**
     * 아동 관람 가능 여부
     */
    public boolean isKidsAllowed() {
        return detail != null && "Y".equalsIgnoreCase(detail.getKidState());
    }

    /**
     * 공연 상태가 활성인지
     */
    public boolean isActive() {
        if (detail == null || detail.getState() == null) {
            return false;
        }
        String state = detail.getState();
        return state.contains("공연중") || state.contains("공연예정");
    }

    /**
     * 좌표 정보가 있는지
     */
    public boolean hasCoordinates() {
        return detail != null &&
               detail.getLatitude() != null && !detail.getLatitude().isEmpty() &&
               detail.getLongitude() != null && !detail.getLongitude().isEmpty();
    }
}
