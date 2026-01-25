package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.util.List;

/**
 * 도서관정보나루 인기대출도서 조회 API XML 응답 매핑 DTO
 * API: http://data4library.kr/api/loanItemSrch
 *
 * 파라미터:
 * - startDt, endDt: 기간
 * - gender: 성별 (0=전체, 1=남성, 2=여성)
 * - from_age, to_age: 연령대 (20-30)
 * - region: 지역코드 (11=서울)
 */
@Data
@JacksonXmlRootElement(localName = "response")
@JsonIgnoreProperties(ignoreUnknown = true)
public class PopularBookResponse {

    @JacksonXmlProperty(localName = "resultNum")
    private Integer resultNum;

    @JacksonXmlProperty(localName = "numFound")
    private Integer numFound;

    @JacksonXmlElementWrapper(localName = "docs")
    @JacksonXmlProperty(localName = "doc")
    private List<BookDoc> books;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BookDoc {

        /** 순위 */
        @JacksonXmlProperty(localName = "no")
        private Integer ranking;

        /** 도서명 */
        @JacksonXmlProperty(localName = "bookname")
        private String bookName;

        /** 저자 */
        @JacksonXmlProperty(localName = "authors")
        private String authors;

        /** 출판사 */
        @JacksonXmlProperty(localName = "publisher")
        private String publisher;

        /** 출판연도 */
        @JacksonXmlProperty(localName = "publication_year")
        private String publicationYear;

        /** ISBN 13 */
        @JacksonXmlProperty(localName = "isbn13")
        private String isbn13;

        /** 부가기호 */
        @JacksonXmlProperty(localName = "addition_symbol")
        private String additionSymbol;

        /** 표지 이미지 URL */
        @JacksonXmlProperty(localName = "bookImageURL")
        private String bookImageUrl;

        /** 분류번호 (KDC) */
        @JacksonXmlProperty(localName = "class_no")
        private String classNo;

        /** 분류명 */
        @JacksonXmlProperty(localName = "class_nm")
        private String classNm;

        /** 대출 건수 */
        @JacksonXmlProperty(localName = "loan_count")
        private Integer loanCount;

        /** 도서 권수 */
        @JacksonXmlProperty(localName = "vol")
        private String vol;

        // Alias getter for isbn13
        public String getIsbn() {
            return isbn13;
        }
    }

    /**
     * 도서 목록이 비어있는지 확인
     */
    public boolean isEmpty() {
        return books == null || books.isEmpty();
    }

    /**
     * 도서 개수 반환
     */
    public int getCount() {
        return books != null ? books.size() : 0;
    }
}
