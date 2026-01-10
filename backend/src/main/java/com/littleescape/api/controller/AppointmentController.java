package com.littleescape.api.controller;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.User;
import com.littleescape.api.dto.AppointmentCompleteRequest;
import com.littleescape.api.dto.AppointmentCreateRequest;
import com.littleescape.api.dto.AppointmentDto;
import com.littleescape.api.dto.AppointmentMissionUpdateRequest;
import com.littleescape.api.dto.AppointmentRequest;
import com.littleescape.api.dto.AppointmentResponse;
import com.littleescape.api.repository.UserRepository;
import com.littleescape.api.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<AppointmentDto> createAppointment(
            @AuthenticationPrincipal String oauthId,
            @Valid @RequestBody AppointmentCreateRequest request) {

        if (oauthId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Appointment appointment = appointmentService.createAppointment(user.getId(), request.scheduledAt(), request.missionId());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppointmentDto.from(appointment));
    }

    @PatchMapping("/{id}/mission")
    public ResponseEntity<Long> updateAppointmentMission(
            @AuthenticationPrincipal String oauthId,
            @PathVariable Long id,
            @Valid @RequestBody AppointmentMissionUpdateRequest request) {

        if (oauthId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Long appointmentId = appointmentService.updateAppointmentMission(user.getId(), id, request.missionId());

        return ResponseEntity.ok(appointmentId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentDetail(
            @AuthenticationPrincipal String oauthId,
            @PathVariable Long id) {

        if (oauthId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        AppointmentResponse appointment = appointmentService.getAppointmentDetail(user.getId(), id);

        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/me")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(
            @AuthenticationPrincipal String oauthId) {

        if (oauthId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<AppointmentResponse> appointments = appointmentService.getMyAppointments(user.getId());

        return ResponseEntity.ok(appointments);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelAppointment(
            @AuthenticationPrincipal String oauthId,
            @PathVariable Long id) {

        if (oauthId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        appointmentService.cancelAppointment(user.getId(), id);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> completeAppointment(
            @AuthenticationPrincipal String oauthId,
            @PathVariable Long id,
            @Valid @RequestBody AppointmentCompleteRequest request) {

        if (oauthId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        appointmentService.completeAppointment(user.getId(), id, request.comment(), request.proofImageUrl());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<AppointmentDto> cloneAppointment(
            @AuthenticationPrincipal String oauthId,
            @PathVariable Long id) {

        if (oauthId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Appointment newAppointment = appointmentService.cloneAppointment(id, user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppointmentDto.from(newAppointment));
    }
}
