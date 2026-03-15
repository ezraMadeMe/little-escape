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

    // ========== 허브 필드 (공통) ==========

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

    /** 장소 태그 (쉼표로 구분, 예: "ALCOHOL_ONLY,VIEW_POINT") */
    @Column(name = "tags", length = 500)
    private String tags;

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

    // ========== Detail 테이블 연관관계 ==========

    /** 공연/축제/문화행사 상세 (1:1, cascade) */
    @OneToOne(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private PlaceDetailPerformance performanceDetail;

    /** 시설(도서관/공원 등) 상세 (1:1, cascade) */
    @OneToOne(mappedBy = "place", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private PlaceDetailFacility facilityDetail;

    // ========== @Deprecated: detail 테이블로 이관 예정 (하위호환 유지) ==========

    /** @deprecated PlaceDetailPerformance.startDate 로 이관 */
    @Deprecated
    @Column(name = "start_date")
    private LocalDate startDate;

    /** @deprecated PlaceDetailPerformance.endDate 로 이관 */
    @Deprecated
    @Column(name = "end_date")
    private LocalDate endDate;

    /** @deprecated PlaceDetailPerformance.ticketPrice 로 이관 */
    @Deprecated
    @Column(name = "ticket_price")
    private Integer ticketPrice;

    /** @deprecated PlaceDetailPerformance.performanceState 로 이관 */
    @Deprecated
    @Column(name = "performance_state", length = 20)
    private String performanceState;

    /** @deprecated PlaceDetailFacility.operatingTime 으로 이관 */
    @Deprecated
    @Column(name = "operating_time", length = 500)
    private String operatingTime;

    /** @deprecated PlaceDetailFacility.closedDays 로 이관 */
    @Deprecated
    @Column(name = "closed_days", length = 500)
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

    // ========== Detail 편의 메서드 ==========

    /**
     * 공연 상세 정보 설정 (cascade로 함께 저장됨)
     */
    public void setPerformanceDetail(PlaceDetailPerformance detail) {
        this.performanceDetail = detail;
        if (detail != null) {
            detail.setPlace(this);
        }
    }

    /**
     * 시설 상세 정보 설정 (cascade로 함께 저장됨)
     */
    public void setFacilityDetail(PlaceDetailFacility detail) {
        this.facilityDetail = detail;
        if (detail != null) {
            detail.setPlace(this);
        }
    }

    // ========== 업데이트 메서드 ==========

    /**
     * 공연 상태 비활성화 (종료된 공연)
     */
    public void deactivate() {
        this.isActive = false;
        this.performanceState = "공연완료"; // 하위호환
        if (this.performanceDetail != null) {
            this.performanceDetail.deactivate();
        }
    }

    public void activate() {
        this.isActive = true;
    }

    public void updateBasicInfo(String name, String address, String url,
                                Double latitude, Double longitude,
                                MissionCategory category, String imageUrl,
                                Boolean isFree, DataSource dataSource) {
        this.name = name;
        this.address = address;
        this.url = url;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
        this.imageUrl = imageUrl;
        this.isFree = isFree;
        this.dataSource = dataSource;
    }

    /**
     * 공연 정보 업데이트 (upsert 시 사용)
     * 허브 컬럼 + detail 테이블 동시 업데이트 (dual-write)
     */
    public void updatePerformanceInfo(String performanceState, Integer ticketPrice,
                                       LocalDate startDate, LocalDate endDate, String imageUrl) {
        // 하위호환: 허브 컬럼 유지
        this.performanceState = performanceState;
        this.ticketPrice = ticketPrice;
        this.startDate = startDate;
        this.endDate = endDate;
        if (endDate != null && endDate.isBefore(LocalDate.now())) {
            this.isActive = false;
        } else {
            this.isActive = true;
        }
        if (imageUrl != null) {
            this.imageUrl = imageUrl;
        }
        // detail 테이블 동시 업데이트
        if (this.performanceDetail != null) {
            this.performanceDetail.updatePerformanceInfo(performanceState, ticketPrice, startDate, endDate);
        }
    }

    /**
     * 활성 상태인지 확인 (종료일 기준)
     */
    public boolean isCurrentlyActive() {
        if (this.isActive == null || !this.isActive) {
            return false;
        }
        // detail 우선, 없으면 허브 컬럼 fallback
        LocalDate checkEndDate = this.endDate;
        if (this.performanceDetail != null && this.performanceDetail.getEndDate() != null) {
            checkEndDate = this.performanceDetail.getEndDate();
        }
        if (checkEndDate != null && checkEndDate.isBefore(LocalDate.now())) {
            return false;
        }
        return true;
    }
}
