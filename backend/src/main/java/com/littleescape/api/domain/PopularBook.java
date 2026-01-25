package com.littleescape.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 인기 대출 도서 엔티티
 * 도서관정보나루 API(loanItemSrch)에서 수집한 인기 대출 도서 데이터
 * 서울 지역 20-30대 대상 인기 도서 목록
 */
@Entity
@Table(name = "popular_books", indexes = {
    @Index(name = "idx_book_isbn", columnList = "isbn"),
    @Index(name = "idx_book_ranking", columnList = "ranking"),
    @Index(name = "idx_book_collected_at", columnList = "collected_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PopularBook extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ISBN 13 */
    @Column(nullable = false, length = 20)
    private String isbn;

    /** 도서명 */
    @Column(nullable = false, length = 300)
    private String title;

    /** 저자 */
    @Column(length = 200)
    private String author;

    /** 출판사 */
    @Column(length = 200)
    private String publisher;

    /** 출판연도 */
    @Column(name = "publication_year", length = 10)
    private String publicationYear;

    /** 표지 이미지 URL */
    @Column(name = "book_image_url", length = 500)
    private String bookImageUrl;

    /** 분류번호 (KDC) */
    @Column(name = "class_no", length = 30)
    private String classNo;

    /** 분류명 */
    @Column(name = "class_nm", length = 100)
    private String classNm;

    /** 순위 */
    @Column
    private Integer ranking;

    /** 대출 횟수 */
    @Column(name = "loan_count")
    private Integer loanCount;

    /** 수집일 (주간별 관리) */
    @Column(name = "collected_at", nullable = false)
    private LocalDate collectedAt;

    /** 도서 소개 (상세 API에서 추가) */
    @Column(length = 2000)
    private String description;

    /** 키워드 (쉼표 구분) */
    @Column(length = 500)
    private String keywords;

    /** 성별 필터 (API 요청 시 사용한 성별, 0=전체, 1=남성, 2=여성) */
    @Column(name = "gender_filter")
    private Integer genderFilter;

    @Builder
    public PopularBook(String isbn, String title, String author, String publisher,
                       String publicationYear, String bookImageUrl,
                       String classNo, String classNm, Integer ranking, Integer loanCount,
                       LocalDate collectedAt, String description, String keywords,
                       Integer genderFilter) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.publicationYear = publicationYear;
        this.bookImageUrl = bookImageUrl;
        this.classNo = classNo;
        this.classNm = classNm;
        this.ranking = ranking;
        this.loanCount = loanCount;
        this.collectedAt = collectedAt != null ? collectedAt : LocalDate.now();
        this.description = description;
        this.keywords = keywords;
        this.genderFilter = genderFilter;
    }

    /**
     * 도서 상세 정보 업데이트 (상세 API 조회 후)
     */
    public void updateDetailInfo(String description, String keywords) {
        this.description = description;
        this.keywords = keywords;
    }

    /**
     * 이번 주 수집된 도서인지 확인
     */
    public boolean isCollectedThisWeek() {
        LocalDate now = LocalDate.now();
        LocalDate weekStart = now.minusDays(now.getDayOfWeek().getValue() - 1);
        return this.collectedAt != null && !this.collectedAt.isBefore(weekStart);
    }
}
