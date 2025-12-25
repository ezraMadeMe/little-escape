package com.littleescape.api.repo;

import com.littleescape.api.domain.PrepEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PrepRepo extends JpaRepository<PrepEntity, UUID> {
  Optional<PrepEntity> findTopByAppointmentIdOrderByPreparedAtDesc(UUID appointmentId);
}
