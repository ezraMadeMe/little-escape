package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 도서관정보나루 도서 키워드 조회 API XML 응답 매핑 DTO
 * API: http://data4library.kr/api/keywordList
 *
 * 파라미터:
 * - isbn13: ISBN 13
 * - additionalYN: 부가정보 포함 (Y/N)
 */
@Data
@JacksonXmlRootElement(localName = "response")
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookKeywordResponse {

    @JacksonXmlElementWrapper(localName = "keywords")
    @JacksonXmlProperty(localName = "keyword")
    private List<Keyword> keywords;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Keyword {

        /** 키워드 */
        @JacksonXmlProperty(localName = "word")
        private String word;

        /** 가중치 */
        @JacksonXmlProperty(localName = "weight")
        private Double weight;
    }

    /**
     * 키워드 목록을 쉼표로 구분된 문자열로 반환
     */
    public String getKeywordsAsString() {
        if (keywords == null || keywords.isEmpty()) {
            return null;
        }
        return keywords.stream()
                .map(Keyword::getWord)
                .filter(word -> word != null && !word.isEmpty())
                .collect(Collectors.joining(","));
    }

    /**
     * 상위 N개 키워드만 추출
     */
    public String getTopKeywords(int limit) {
        if (keywords == null || keywords.isEmpty()) {
            return null;
        }
        return keywords.stream()
                .sorted((a, b) -> {
                    Double wa = a.getWeight() != null ? a.getWeight() : 0.0;
                    Double wb = b.getWeight() != null ? b.getWeight() : 0.0;
                    return wb.compareTo(wa); // 내림차순
                })
                .limit(limit)
                .map(Keyword::getWord)
                .filter(word -> word != null && !word.isEmpty())
                .collect(Collectors.joining(","));
    }

    /**
     * 키워드 목록이 비어있는지 확인
     */
    public boolean isEmpty() {
        return keywords == null || keywords.isEmpty();
    }
}
