package com.littleescape.api.repository;

import com.littleescape.api.domain.PopularBook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 인기 대출 도서 Repository
 */
@Repository
public interface PopularBookRepository extends JpaRepository<PopularBook, Long> {

    /**
     * ISBN으로 조회
     */
    Optional<PopularBook> findByIsbn(String isbn);

    /**
     * 특정 주의 인기 도서 조회 (수집일 기준)
     */
    List<PopularBook> findByCollectedAtOrderByRankingAsc(LocalDate collectedAt);

    /**
     * 특정 기간 내 인기 도서 조회
     */
    @Query("SELECT pb FROM PopularBook pb WHERE pb.collectedAt BETWEEN :startDate AND :endDate ORDER BY pb.ranking ASC")
    List<PopularBook> findByCollectedAtBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    /**
     * 이번 주 인기 도서 조회
     */
    @Query("SELECT pb FROM PopularBook pb WHERE pb.collectedAt >= :weekStart ORDER BY pb.ranking ASC")
    List<PopularBook> findThisWeekPopularBooks(@Param("weekStart") LocalDate weekStart);

    /**
     * 성별 필터 적용 인기 도서 조회
     * genderFilter: 0=전체, 1=남성, 2=여성
     */
    List<PopularBook> findByGenderFilterAndCollectedAtOrderByRankingAsc(
            Integer genderFilter,
            LocalDate collectedAt
    );

    /**
     * 상위 N개 인기 도서 조회
     */
    @Query("SELECT pb FROM PopularBook pb WHERE pb.collectedAt >= :weekStart ORDER BY pb.ranking ASC LIMIT :limit")
    List<PopularBook> findTopNThisWeek(
            @Param("weekStart") LocalDate weekStart,
            @Param("limit") int limit
    );

    /**
     * 중복 도서 확인 (같은 주에 같은 ISBN)
     */
    boolean existsByIsbnAndCollectedAt(String isbn, LocalDate collectedAt);

    /**
     * 특정 날짜의 도서 삭제 (재수집 시)
     */
    void deleteByCollectedAt(LocalDate collectedAt);

    /**
     * 오래된 데이터 삭제 (N주 이전)
     */
    @Query("DELETE FROM PopularBook pb WHERE pb.collectedAt < :cutoffDate")
    void deleteOlderThan(@Param("cutoffDate") LocalDate cutoffDate);

    /**
     * 분류별 인기 도서 조회
     */
    List<PopularBook> findByClassNmContainingAndCollectedAtOrderByRankingAsc(
            String classNm,
            LocalDate collectedAt
    );
}
