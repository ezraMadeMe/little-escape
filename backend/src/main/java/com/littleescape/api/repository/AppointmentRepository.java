package com.littleescape.api.repository;

import com.littleescape.api.domain.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserId(Long userId);
    List<Appointment> findAllByUserIdOrderByScheduledAtDesc(Long userId);
}
