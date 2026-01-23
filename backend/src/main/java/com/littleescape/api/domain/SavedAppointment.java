package com.littleescape.api.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * 사용자가 저장한 약속 (Scrap/Bookmark)
 * N:M 관계를 풀어낸 중간 테이블
 * 추후 미션 추천 시 카테고리 가중치 계산에 활용
 */
@Entity
@Table(
    name = "saved_appointments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "appointment_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class SavedAppointment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    // 편의 생성자
    public SavedAppointment(User user, Appointment appointment) {
        this.user = user;
        this.appointment = appointment;
    }
}
