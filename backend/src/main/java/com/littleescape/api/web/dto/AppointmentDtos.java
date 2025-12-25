package com.littleescape.api.web.dto;

import com.littleescape.api.domain.Enums.Day;
import com.littleescape.api.domain.Enums.TimeSlot;
import jakarta.validation.constraints.*;

import java.util.UUID;

public class AppointmentDtos {

  public record CreateAppointmentReq(
      @NotNull Day day,
      @NotNull TimeSlot timeSlot,
      @Min(20) @Max(480) int durationMin
  ) {}

  public record AppointmentRes(
      UUID id,
      Day day,
      TimeSlot timeSlot,
      int durationMin,
      long createdAt
  ) {}
}
