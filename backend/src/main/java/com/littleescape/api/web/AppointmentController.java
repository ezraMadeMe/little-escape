package com.littleescape.api.web;

import com.littleescape.api.service.AppointmentService;
import com.littleescape.api.web.dto.AppointmentDtos.*;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/appointments")
public class AppointmentController {

  private final AppointmentService appointmentService;

  public AppointmentController(AppointmentService appointmentService) {
    this.appointmentService = appointmentService;
  }

  @PostMapping
  public ApiResponse<AppointmentRes> create(@Valid @RequestBody CreateAppointmentReq req) {
    return ApiResponse.ok(appointmentService.create(req));
  }
}
