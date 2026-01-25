package com.littleescape.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 도서관 정보 엔티티
 * 도서관정보나루 API(libSrch)에서 수집한 정보공개 도서관 데이터
 */
@Entity
@Table(name = "libraries", indexes = {
    @Index(name = "idx_library_code", columnList = "library_code", unique = true),
    @Index(name = "idx_library_name", columnList = "name")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Library extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 도서관 코드 (도서관정보나루 고유 ID) */
    @Column(name = "library_code", nullable = false, unique = true, length = 50)
    private String libraryCode;

    /** 도서관명 */
    @Column(nullable = false, length = 200)
    private String name;

    /** 주소 */
    @Column(length = 300)
    private String address;

    /** 전화번호 */
    @Column(length = 30)
    private String tel;

    /** 홈페이지 */
    @Column(length = 500)
    private String homepage;

    /** 위도 */
    @Column
    private Double latitude;

    /** 경도 */
    @Column
    private Double longitude;

    /** 휴관일 (예: "매주 월요일, 법정공휴일") */
    @Column(name = "closed_days", length = 300)
    private String closedDays;

    /** 운영시간 */
    @Column(name = "operating_time", length = 300)
    private String operatingTime;

    /** 장서 수 */
    @Column(name = "book_count")
    private Integer bookCount;

    /** 정보공개 도서관 여부 */
    @Column(name = "is_open_for_disclosure")
    private Boolean isOpenForDisclosure = true;

    @Builder
    public Library(String libraryCode, String name, String address, String tel,
                   String homepage, Double latitude, Double longitude,
                   String closedDays, String operatingTime, Integer bookCount,
                   Boolean isOpenForDisclosure) {
        this.libraryCode = libraryCode;
        this.name = name;
        this.address = address;
        this.tel = tel;
        this.homepage = homepage;
        this.latitude = latitude;
        this.longitude = longitude;
        this.closedDays = closedDays;
        this.operatingTime = operatingTime;
        this.bookCount = bookCount;
        this.isOpenForDisclosure = isOpenForDisclosure != null ? isOpenForDisclosure : true;
    }

    /**
     * 도서관 정보 업데이트
     */
    public void updateInfo(String address, String tel, String homepage,
                           Double latitude, Double longitude,
                           String closedDays, String operatingTime, Integer bookCount) {
        this.address = address;
        this.tel = tel;
        this.homepage = homepage;
        this.latitude = latitude;
        this.longitude = longitude;
        this.closedDays = closedDays;
        this.operatingTime = operatingTime;
        this.bookCount = bookCount;
    }

    /**
     * 오늘 휴관인지 확인 (간단한 체크)
     * 실제로는 더 정교한 휴관일 파싱 필요
     */
    public boolean isClosedToday(java.time.DayOfWeek dayOfWeek) {
        if (this.closedDays == null) {
            return false;
        }
        String closedLower = this.closedDays.toLowerCase();
        return switch (dayOfWeek) {
            case MONDAY -> closedLower.contains("월요일") || closedLower.contains("월");
            case TUESDAY -> closedLower.contains("화요일") || closedLower.contains("화");
            case WEDNESDAY -> closedLower.contains("수요일") || closedLower.contains("수");
            case THURSDAY -> closedLower.contains("목요일") || closedLower.contains("목");
            case FRIDAY -> closedLower.contains("금요일") || closedLower.contains("금");
            case SATURDAY -> closedLower.contains("토요일") || closedLower.contains("토");
            case SUNDAY -> closedLower.contains("일요일") || closedLower.contains("일");
        };
    }
}
