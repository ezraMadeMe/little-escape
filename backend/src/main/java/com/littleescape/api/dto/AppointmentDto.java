package com.littleescape.api.dto;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;

import java.time.LocalDateTime;

public record AppointmentDto(
    Long id,
    Long userId,
    Long missionId,
    String missionTitle,
    AppointmentStatus status,
    LocalDateTime scheduledAt,
    LocalDateTime createdAt
) {
    public static AppointmentDto from(Appointment appointment) {
        return new AppointmentDto(
            appointment.getId(),
            appointment.getUser().getId(),
            appointment.getMissionTemplate() != null ? appointment.getMissionTemplate().getId() : null,
            appointment.getMissionTemplate() != null ? appointment.getMissionTemplate().getTitle() : null,
            appointment.getStatus(),
            appointment.getScheduledAt(),
            appointment.getCreatedAt()
        );
    }
}
