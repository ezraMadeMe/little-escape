package com.littleescape.api.repo;

import com.littleescape.api.domain.AppointmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AppointmentRepo extends JpaRepository<AppointmentEntity, UUID> {}
