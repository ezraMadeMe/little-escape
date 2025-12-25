package com.littleescape.api.service;

import com.littleescape.api.domain.AppointmentEntity;
import com.littleescape.api.repo.AppointmentRepo;
import com.littleescape.api.web.dto.AppointmentDtos.AppointmentRes;
import com.littleescape.api.web.dto.AppointmentDtos.CreateAppointmentReq;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AppointmentService {
  private final AppointmentRepo appointmentRepo;

  public AppointmentService(AppointmentRepo appointmentRepo) {
    this.appointmentRepo = appointmentRepo;
  }

  @Transactional
  public AppointmentRes create(CreateAppointmentReq req) {
    AppointmentEntity e = AppointmentEntity.of(req.day(), req.timeSlot(), req.durationMin());
    appointmentRepo.save(e);
    return new AppointmentRes(
        e.id,
        e.getDay(),
        e.getTimeSlot(),
        e.getDurationMin(),
        e.getCreatedAt()
    );
  }

  public AppointmentEntity get(UUID id) {
    return appointmentRepo.findById(id).orElseThrow(() -> new IllegalArgumentException("Appointment not found"));
  }
}
