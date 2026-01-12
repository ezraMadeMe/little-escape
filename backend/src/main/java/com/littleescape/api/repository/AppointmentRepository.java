package com.littleescape.api.repository;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserId(Long userId);
    
    // 사용자의 약속을 예정일 기준 내림차순으로 조회 (DB 정렬)
    List<Appointment> findAllByUserIdOrderByScheduledAtDesc(Long userId);
    
    Long countByUserIdAndMissionTemplateId(Long userId, Long missionTemplateId);
    boolean existsByUserIdAndStatusIn(Long userId, List<AppointmentStatus> statuses);

    // 특정 시간 범위 사이에 있는 약속 조회
    List<Appointment> findAllByScheduledAtBetween(LocalDateTime start, LocalDateTime end);

    List<Appointment> findAllByStatusAndScheduledAtBetween(
        AppointmentStatus status,
        LocalDateTime start,
        LocalDateTime end
    );

    void deleteByUserId(Long userId);
}