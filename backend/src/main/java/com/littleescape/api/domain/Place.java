package com.littleescape.api.domain;

import com.littleescape.api.domain.type.DataSource;
import com.littleescape.api.domain.type.MissionCategory;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "places", indexes = {
    @Index(name = "idx_place_external_id", columnList = "external_id"),
    @Index(name = "idx_place_data_source", columnList = "data_source"),
    @Index(name = "idx_place_category", columnList = "category"),
    @Index(name = "idx_place_is_active", columnList = "is_active")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Place extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 200)
    private String address;

    @Column(length = 500)
    private String url;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MissionCategory category;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // 장소 태그 (쉼표로 구분된 문자열)
    // 예: "ALCOHOL_ONLY,VIEW_POINT"
    @Column(name = "tags", length = 500)
    private String tags;

    // ========== 신규 필드 (공연/행사 정보) ==========

    /** 공연/행사 시작일 */
    @Column(name = "start_date")
    private LocalDate startDate;

    /** 공연/행사 종료일 */
    @Column(name = "end_date")
    private LocalDate endDate;

    /** 티켓 가격 (최저가, 원 단위) */
    @Column(name = "ticket_price")
    private Integer ticketPrice;

    /** 무료 여부 */
    @Column(name = "is_free")
    private Boolean isFree;

    /** 데이터 수집 출처 (KOPIS, SEOUL, LIBRARY 등) */
    @Enumerated(EnumType.STRING)
    @Column(name = "data_source", length = 30)
    private DataSource dataSource;

    /** 외부 API의 고유 ID (중복 체크용) */
    @Column(name = "external_id", length = 100)
    private String externalId;

    /** 활성 상태 (종료일 지나면 false) */
    @Column(name = "is_active")
    private Boolean isActive = true;

    /** 공연 상태 (공연중, 공연예정, 공연완료) - KOPIS 전용 */
    @Column(name = "performance_state", length = 20)
    private String performanceState;

    /** 운영 시간 (도서관, 공원 등) */
    @Column(name = "operating_time", length = 200)
    private String operatingTime;

    /** 휴관일/휴무일 정보 */
    @Column(name = "closed_days", length = 200)
    private String closedDays;

    // ========== 기존 생성자 (하위 호환성 유지) ==========

    public Place(String name, String address, String url, Double latitude, Double longitude, MissionCategory category) {
        this.name = name;
        this.address = address;
        this.url = url;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
        this.isActive = true;
    }

    /**
     * imageUrl을 포함한 생성자 (데이터 수집 시 사용)
     */
    public Place(String name, String address, String url, Double latitude, Double longitude, MissionCategory category, String imageUrl) {
        this.name = name;
        this.address = address;
        this.url = url;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
        this.imageUrl = imageUrl;
        this.isActive = true;
    }

    // ========== Builder 패턴 생성자 ==========

    @Builder
    public Place(String name, String address, String url, Double latitude, Double longitude,
                 MissionCategory category, String imageUrl, String tags,
                 LocalDate startDate, LocalDate endDate, Integer ticketPrice, Boolean isFree,
                 DataSource dataSource, String externalId, Boolean isActive,
                 String performanceState, String operatingTime, String closedDays) {
        this.name = name;
        this.address = address;
        this.url = url;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
        this.imageUrl = imageUrl;
        this.tags = tags;
        this.startDate = startDate;
        this.endDate = endDate;
        this.ticketPrice = ticketPrice;
        this.isFree = isFree;
        this.dataSource = dataSource;
        this.externalId = externalId;
        this.isActive = isActive != null ? isActive : true;
        this.performanceState = performanceState;
        this.operatingTime = operatingTime;
        this.closedDays = closedDays;
    }

    // ========== 업데이트 메서드 ==========

    /**
     * 공연 상태 비활성화 (종료된 공연)
     */
    public void deactivate() {
        this.isActive = false;
        this.performanceState = "공연완료";
    }

    /**
     * 공연 정보 업데이트 (upsert 시 사용)
     */
    public void updatePerformanceInfo(String performanceState, Integer ticketPrice,
                                       LocalDate startDate, LocalDate endDate, String imageUrl) {
        this.performanceState = performanceState;
        this.ticketPrice = ticketPrice;
        this.startDate = startDate;
        this.endDate = endDate;
        if (imageUrl != null) {
            this.imageUrl = imageUrl;
        }
    }

    /**
     * 활성 상태인지 확인 (종료일 기준)
     */
    public boolean isCurrentlyActive() {
        if (this.isActive == null || !this.isActive) {
            return false;
        }
        if (this.endDate != null && this.endDate.isBefore(LocalDate.now())) {
            return false;
        }
        return true;
    }
}
