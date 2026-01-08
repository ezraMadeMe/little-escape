package com.littleescape.api.dto;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;

import java.time.LocalDateTime;

public record AppointmentResponse(
    Long id,
    String missionTitle,
    AppointmentStatus status,
    LocalDateTime scheduledAt,
    LocalDateTime createdAt
) {
    public static AppointmentResponse from(Appointment appointment) {
        return new AppointmentResponse(
            appointment.getId(),
            appointment.getMissionTemplate() != null ? appointment.getMissionTemplate().getTitle() : "미션 없음",
            appointment.getStatus(),
            appointment.getScheduledAt(),
            appointment.getCreatedAt()
        );
    }
}
