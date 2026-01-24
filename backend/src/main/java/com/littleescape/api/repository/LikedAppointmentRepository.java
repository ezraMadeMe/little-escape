package com.littleescape.api.repository;

import com.littleescape.api.domain.LikedAppointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LikedAppointmentRepository extends JpaRepository<LikedAppointment, Long> {

    // 특정 사용자와 약속의 좋아요 여부 확인
    boolean existsByUserIdAndAppointmentId(Long userId, Long appointmentId);

    // 특정 사용자와 약속의 좋아요 레코드 조회
    Optional<LikedAppointment> findByUserIdAndAppointmentId(Long userId, Long appointmentId);

    // 특정 사용자가 좋아요한 모든 약속 조회
    List<LikedAppointment> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    // 좋아요 개수 조회
    Long countByUserId(Long userId);

    // 특정 약속의 좋아요 개수
    Long countByAppointmentId(Long appointmentId);

    // 사용자 삭제 시 좋아요 레코드도 함께 삭제
    void deleteByUserId(Long userId);

    // 약속 삭제 시 해당 약속을 좋아요한 모든 레코드 삭제
    void deleteByAppointmentId(Long appointmentId);
}
