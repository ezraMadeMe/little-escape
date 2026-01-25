package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.util.List;

/**
 * KOPIS API XML 응답 매핑 DTO
 * API: http://www.kopis.or.kr/openApi/restful/pblprfr
 */
@Data
@JacksonXmlRootElement(localName = "dbs")
@JsonIgnoreProperties(ignoreUnknown = true)
public class KopisResponse {

    @JacksonXmlElementWrapper(useWrapping = false)
    @JacksonXmlProperty(localName = "db")
    private List<Performance> performances;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Performance {
        
        @JacksonXmlProperty(localName = "mt20id")
        private String id;  // 공연 ID
        
        @JacksonXmlProperty(localName = "prfnm")
        private String name;  // 공연명
        
        @JacksonXmlProperty(localName = "prfpdfrom")
        private String startDate;  // 공연 시작일
        
        @JacksonXmlProperty(localName = "prfpdto")
        private String endDate;  // 공연 종료일
        
        @JacksonXmlProperty(localName = "fcltynm")
        private String facilityName;  // 공연시설명 (장소)
        
        @JacksonXmlProperty(localName = "poster")
        private String posterUrl;  // 포스터 이미지 URL
        
        @JacksonXmlProperty(localName = "area")
        private String area;  // 지역
        
        @JacksonXmlProperty(localName = "genrenm")
        private String genre;  // 장르
        
        @JacksonXmlProperty(localName = "prfstate")
        private String state;  // 공연 상태 (공연중, 공연예정 등)
        
        @JacksonXmlProperty(localName = "openrun")
        private String openRun;  // 오픈런 여부 (Y/N)
    }
}





