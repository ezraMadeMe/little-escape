package com.littleescape.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 공연/축제/문화행사 전용 상세 정보
 * Place(허브)와 1:1 관계 - KOPIS, 서울시 문화행사 등
 */
@Entity
@Table(name = "place_detail_performance", indexes = {
    @Index(name = "idx_perf_detail_place_id", columnList = "place_id", unique = true),
    @Index(name = "idx_perf_detail_state", columnList = "performance_state"),
    @Index(name = "idx_perf_detail_end_date", columnList = "end_date")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlaceDetailPerformance extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false, unique = true)
    private Place place;

    /** 공연/행사 시작일 */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** 공연/행사 종료일 */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** 티켓 가격 (최저가, 원 단위) */
    @Column(name = "ticket_price")
    private Integer ticketPrice;

    /** 공연 상태 (공연중, 공연예정, 공연완료) */
    @Column(name = "performance_state", length = 20)
    private String performanceState;

    @Builder
    public PlaceDetailPerformance(Place place, LocalDate startDate, LocalDate endDate,
                                   Integer ticketPrice, String performanceState) {
        this.place = place;
        this.startDate = startDate;
        this.endDate = endDate;
        this.ticketPrice = ticketPrice;
        this.performanceState = performanceState;
    }

    public void updatePerformanceInfo(String performanceState, Integer ticketPrice,
                                       LocalDate startDate, LocalDate endDate) {
        this.performanceState = performanceState;
        this.ticketPrice = ticketPrice;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    public void deactivate() {
        this.performanceState = "공연완료";
    }

    // Place 양방향 설정용
    void setPlace(Place place) {
        this.place = place;
    }
}
