package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.util.List;

/**
 * 도서관정보나루 API XML 응답 매핑 DTO
 * API: http://data4library.kr/api/libSrch
 *
 * API 응답에 "request" 등 매핑되지 않은 필드가 포함될 수 있어
 * JsonIgnoreProperties 어노테이션으로 unknown properties를 무시함
 */
@Data
@JacksonXmlRootElement(localName = "response")
@JsonIgnoreProperties(ignoreUnknown = true)
public class LibraryResponse {

    @JacksonXmlProperty(localName = "pageNo")
    private Integer pageNo;
    
    @JacksonXmlProperty(localName = "pageSize")
    private Integer pageSize;
    
    @JacksonXmlProperty(localName = "numFound")
    private Integer totalCount;

    @JacksonXmlElementWrapper(localName = "libs")
    @JacksonXmlProperty(localName = "lib")
    private List<Library> libraries;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Library {
        
        @JacksonXmlProperty(localName = "libCode")
        private String code;  // 도서관 코드
        
        @JacksonXmlProperty(localName = "libName")
        private String name;  // 도서관명
        
        @JacksonXmlProperty(localName = "address")
        private String address;  // 주소
        
        @JacksonXmlProperty(localName = "tel")
        private String tel;  // 전화번호
        
        @JacksonXmlProperty(localName = "latitude")
        private String latitude;  // 위도
        
        @JacksonXmlProperty(localName = "longitude")
        private String longitude;  // 경도
        
        @JacksonXmlProperty(localName = "homepage")
        private String homepage;  // 홈페이지
        
        @JacksonXmlProperty(localName = "closed")
        private String closed;  // 휴관일
        
        @JacksonXmlProperty(localName = "operatingTime")
        private String operatingTime;  // 운영시간
        
        @JacksonXmlProperty(localName = "bookCount")
        private String bookCount;  // 장서 수

        // Alias getter for closed (휴관일)
        public String getClosedDays() {
            return closed;
        }
    }
}





