package com.littleescape.api.domain;

import com.littleescape.api.domain.type.AppointmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
public class Appointment extends BaseTimeEntity {

    @PrePersist
    public void prePersist() {
        if (this.unlockToken == null) {
            this.unlockToken = java.util.UUID.randomUUID().toString();
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mission_template_id", nullable = true)
    private MissionTemplate missionTemplate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "place_id", nullable = true)
    private Place place;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status = AppointmentStatus.CREATED;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt = LocalDateTime.now().plusDays(3);

    // 미션 공개용 UUID 토큰 (보안)
    @Column(name = "unlock_token", unique = true, length = 36)
    private String unlockToken;

    // 사용자 출발 위치 (GPS 또는 수동 입력)
    @Column(name = "departure_latitude")
    private Double departureLatitude;

    @Column(name = "departure_longitude")
    private Double departureLongitude;

    // 검색 반경 (km)
    @Column(name = "search_radius", nullable = false)
    private Integer searchRadius = 5;

    @Column(name = "proof_comment", columnDefinition = "TEXT")
    private String proofComment;

    @Deprecated
    @Column(name = "proof_image_url", length = 500)
    private String proofImageUrl;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "appointment_proof_images", joinColumns = @JoinColumn(name = "appointment_id"))
    @Column(name = "image_url", length = 500)
    private java.util.List<String> proofImageUrls = new java.util.ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "appointment_review_keywords", joinColumns = @JoinColumn(name = "appointment_id"))
    @Column(name = "keyword")
    private java.util.List<String> reviewKeywords = new java.util.ArrayList<>();

    @Column(name = "is_favorite", nullable = false)
    private boolean isFavorite = false;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // 비즈니스 로직 메서드
    public void cancel() {
        this.status = AppointmentStatus.CANCELLED;
    }

    public void updateMission(MissionTemplate missionTemplate) {
        this.missionTemplate = missionTemplate;
    }

    public void updatePlace(Place place) {
        this.place = place;
    }

    public void toggleFavorite() {
        this.isFavorite = !this.isFavorite;
    }
}
