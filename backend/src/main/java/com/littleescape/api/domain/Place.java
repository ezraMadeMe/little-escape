package com.littleescape.api.domain;

import com.littleescape.api.domain.type.MissionCategory;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "places")
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

    public Place(String name, String address, String url, Double latitude, Double longitude, MissionCategory category) {
        this.name = name;
        this.address = address;
        this.url = url;
        this.latitude = latitude;
        this.longitude = longitude;
        this.category = category;
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
    }
}
