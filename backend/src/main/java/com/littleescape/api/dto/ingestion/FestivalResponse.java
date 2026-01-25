package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.util.List;

/**
 * KOPIS 축제 목록 조회 API XML 응답 매핑 DTO
 * API: http://www.kopis.or.kr/openApi/restful/prffest
 *
 * 파라미터:
 * - stdate, eddate: 기간 (yyyyMMdd)
 * - signgucode: 지역코드 (11=서울)
 * - prfstate: 공연상태 (01=공연예정, 02=공연중)
 * - kidstate: 아동 관람가 (Y/N)
 */
@Data
@JacksonXmlRootElement(localName = "dbs")
@JsonIgnoreProperties(ignoreUnknown = true)
public class FestivalResponse {

    @JacksonXmlElementWrapper(useWrapping = false)
    @JacksonXmlProperty(localName = "db")
    private List<Festival> festivals;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Festival {

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

        /** 포스터 URL */
        @JacksonXmlProperty(localName = "poster")
        private String posterUrl;

        /** 지역 */
        @JacksonXmlProperty(localName = "area")
        private String area;

        /** 장르명 */
        @JacksonXmlProperty(localName = "genrenm")
        private String genre;

        /** 공연 상태 (공연중, 공연예정, 공연완료) */
        @JacksonXmlProperty(localName = "prfstate")
        private String state;

        /** 오픈런 여부 (Y/N) */
        @JacksonXmlProperty(localName = "openrun")
        private String openRun;

        /** 축제 여부 플래그 (Y) */
        @JacksonXmlProperty(localName = "festival")
        private String festivalFlag;
    }

    /**
     * 축제 목록이 비어있는지 확인
     */
    public boolean isEmpty() {
        return festivals == null || festivals.isEmpty();
    }

    /**
     * 축제 개수 반환
     */
    public int getCount() {
        return festivals != null ? festivals.size() : 0;
    }
}
