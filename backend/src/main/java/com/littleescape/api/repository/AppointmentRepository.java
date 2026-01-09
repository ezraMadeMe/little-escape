package com.littleescape.api.repository;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserId(Long userId);
    
    // 사용자의 약속을 예정일 기준 내림차순으로 조회 (DB 정렬)
    List<Appointment> findAllByUserIdOrderByScheduledAtDesc(Long userId);
    
    Long countByUserIdAndMissionTemplateId(Long userId, Long missionTemplateId);
    boolean existsByUserIdAndStatusIn(Long userId, List<AppointmentStatus> statuses);
}