package com.littleescape.api.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * 사용자가 좋아요한 약속 (Like)
 * N:M 관계를 풀어낸 중간 테이블
 */
@Entity
@Table(
    name = "liked_appointments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "appointment_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class LikedAppointment extends BaseTimeEntity {

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
    public LikedAppointment(User user, Appointment appointment) {
        this.user = user;
        this.appointment = appointment;
    }
}
