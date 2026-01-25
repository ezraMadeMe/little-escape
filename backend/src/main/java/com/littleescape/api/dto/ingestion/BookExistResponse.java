package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.util.List;

/**
 * 도서관정보나루 도서 소장/대출가능 조회 API XML 응답 매핑 DTO
 * API: http://data4library.kr/api/bookExist
 *
 * 파라미터:
 * - libCode: 도서관 코드 (단일 도서관 조회) or region (지역별 조회)
 * - isbn13: ISBN 13
 */
@Data
@JacksonXmlRootElement(localName = "response")
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookExistResponse {

    @JacksonXmlProperty(localName = "result")
    private Result result;

    @JacksonXmlElementWrapper(localName = "libs")
    @JacksonXmlProperty(localName = "lib")
    private List<LibraryInfo> libraries;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {

        /** 도서 소장 여부 (Y/N) */
        @JacksonXmlProperty(localName = "hasBook")
        private String hasBook;

        /** 대출 가능 여부 (Y/N) */
        @JacksonXmlProperty(localName = "loanAvailable")
        private String loanAvailable;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class LibraryInfo {
        @JacksonXmlProperty(localName = "libCode")
        private String libCode;

        @JacksonXmlProperty(localName = "libName")
        private String libName;

        @JacksonXmlProperty(localName = "hasBook")
        private String hasBook;

        @JacksonXmlProperty(localName = "loanAvailable")
        private String loanAvailable;
    }

    /**
     * 도서 소장 여부 확인
     */
    public boolean hasBook() {
        return result != null && "Y".equalsIgnoreCase(result.getHasBook());
    }

    /**
     * 대출 가능 여부 확인
     */
    public boolean isLoanAvailable() {
        return result != null && "Y".equalsIgnoreCase(result.getLoanAvailable());
    }

    /**
     * 소장 + 대출 가능 여부 확인
     */
    public boolean isAvailableForLoan() {
        return hasBook() && isLoanAvailable();
    }

    /**
     * 도서관 목록이 비어있는지 확인
     */
    public boolean isEmpty() {
        return libraries == null || libraries.isEmpty();
    }

    /**
     * 도서관 목록 반환 (null-safe)
     */
    public List<LibraryInfo> getLibraries() {
        return libraries;
    }
}
