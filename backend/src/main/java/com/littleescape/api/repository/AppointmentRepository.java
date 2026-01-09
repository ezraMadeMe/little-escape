package com.littleescape.api.repository;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserId(Long userId);
    List<Appointment> findAllByUserIdOrderByScheduledAtDesc(Long userId);
    Long countByUserIdAndMissionTemplateId(Long userId, Long missionTemplateId);
    boolean existsByUserIdAndStatusIn(Long userId, List<AppointmentStatus> statuses);
}
