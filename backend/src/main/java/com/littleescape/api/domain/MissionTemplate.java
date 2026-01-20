package com.littleescape.api.domain;

import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.TimeOfDay;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mission_templates")
@Getter
@Setter
@NoArgsConstructor
public class MissionTemplate extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MissionCategory category;

    @Column(name = "difficulty_level", nullable = false)
    private String difficultyLevel;

    @Column(columnDefinition = "TEXT")
    private String condition;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", nullable = false)
    private LocationType locationType = LocationType.ANY;

    @Enumerated(EnumType.STRING)
    @Column(name = "time_of_day", nullable = false)
    private TimeOfDay timeOfDay = TimeOfDay.ANY;

    // 장소 필수 여부
    @Column(name = "is_place_required", nullable = false)
    private Boolean isPlaceRequired = false;

    // 미션 장소 위치
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    // 지번/도로명 주소
    @Column(name = "address", length = 500)
    private String address;

    // 미션 태그 (쉼표로 구분된 문자열)
    // 예: "HIGH_ACTIVITY,ALCOHOL_ONLY"
    @Column(name = "tags", length = 500)
    private String tags;

    // 단계별 가이드 (JSON 형식)
    // 예: [{"icon": "WALK", "title": "중랑천 바람 쐬기", "desc": "장한평역 3번 출구에서 뚝방길 따라 20분 걷기."}]
    @Column(name = "guide", columnDefinition = "JSONB")
    private String guide;
}
