package com.littleescape.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 시설(도서관, 공원 등) 전용 상세 정보
 * Place(허브)와 1:1 관계 - 운영시간, 휴관일, 연락처 등
 */
@Entity
@Table(name = "place_detail_facility", indexes = {
    @Index(name = "idx_fac_detail_place_id", columnList = "place_id", unique = true)
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlaceDetailFacility extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = false, unique = true)
    private Place place;

    /** 운영 시간 */
    @Column(name = "operating_time", length = 500)
    private String operatingTime;

    /** 휴관일/휴무일 */
    @Column(name = "closed_days", length = 500)
    private String closedDays;

    /** 전화번호 */
    @Column(length = 30)
    private String tel;

    /** 홈페이지 */
    @Column(length = 500)
    private String homepage;

    @Builder
    public PlaceDetailFacility(Place place, String operatingTime, String closedDays,
                                String tel, String homepage) {
        this.place = place;
        this.operatingTime = operatingTime;
        this.closedDays = closedDays;
        this.tel = tel;
        this.homepage = homepage;
    }

    public void updateFacilityInfo(String operatingTime, String closedDays,
                                    String tel, String homepage) {
        this.operatingTime = operatingTime;
        this.closedDays = closedDays;
        this.tel = tel;
        this.homepage = homepage;
    }

    // Place 양방향 설정용
    void setPlace(Place place) {
        this.place = place;
    }
}
