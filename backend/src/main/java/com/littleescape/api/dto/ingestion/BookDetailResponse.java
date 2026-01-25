package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

/**
 * 도서관정보나루 도서 상세조회 API XML 응답 매핑 DTO
 * API: http://data4library.kr/api/srchDtlList
 *
 * 파라미터:
 * - isbn13: ISBN 13
 * - loaninfoYN: 대출정보 포함 여부 (Y/N)
 */
@Data
@JacksonXmlRootElement(localName = "response")
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookDetailResponse {

    @JacksonXmlProperty(localName = "detail")
    private Detail detail;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Detail {

        @JacksonXmlProperty(localName = "book")
        private BookInfo book;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class BookInfo {

        /** ISBN 13 */
        @JacksonXmlProperty(localName = "isbn13")
        private String isbn13;

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

        /** 분류번호 */
        @JacksonXmlProperty(localName = "class_no")
        private String classNo;

        /** 분류명 */
        @JacksonXmlProperty(localName = "class_nm")
        private String classNm;

        /** 책 소개 */
        @JacksonXmlProperty(localName = "description")
        private String description;

        /** 표지 이미지 URL */
        @JacksonXmlProperty(localName = "bookImageURL")
        private String bookImageUrl;

        /** 도서 권수 */
        @JacksonXmlProperty(localName = "vol")
        private String vol;
    }

    /**
     * 책 소개 반환 (null-safe)
     */
    public String getDescription() {
        if (detail != null && detail.getBook() != null) {
            return detail.getBook().getDescription();
        }
        return null;
    }

    /**
     * 도서 정보 반환 (null-safe)
     */
    public BookInfo getBookInfo() {
        if (detail != null) {
            return detail.getBook();
        }
        return null;
    }

    /**
     * 비어있는지 확인
     */
    public boolean isEmpty() {
        return getBookInfo() == null;
    }

    /**
     * 도서 목록 형태로 반환 (LibraryApiService 호환용)
     */
    public java.util.List<BookInfo> getBooks() {
        BookInfo info = getBookInfo();
        if (info != null) {
            return java.util.List.of(info);
        }
        return java.util.Collections.emptyList();
    }
}
