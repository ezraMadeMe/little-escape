package com.littleescape.api.controller;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.User;
import com.littleescape.api.dto.AppointmentCompleteRequest;
import com.littleescape.api.dto.AppointmentCreateRequest;
import com.littleescape.api.dto.AppointmentDto;
import com.littleescape.api.dto.AppointmentMissionUpdateRequest;
import com.littleescape.api.dto.AppointmentRequest;
import com.littleescape.api.dto.AppointmentResponse;
import com.littleescape.api.dto.FeedResponse;
import com.littleescape.api.repository.UserRepository;
import com.littleescape.api.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<AppointmentDto> createAppointment(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody AppointmentCreateRequest request) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Appointment appointment = appointmentService.createAppointment(
            Long.parseLong(userId),
            request.scheduledAt(),
            request.missionId(),
            request.getUserLatitude(),
            request.getUserLongitude()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppointmentDto.from(appointment));
    }

    @PatchMapping("/{id}/mission")
    public ResponseEntity<Long> updateAppointmentMission(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id,
            @Valid @RequestBody AppointmentMissionUpdateRequest request) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long appointmentId = appointmentService.updateAppointmentMission(Long.parseLong(userId), id, request.missionId());

        return ResponseEntity.ok(appointmentId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponse> getAppointmentDetail(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AppointmentResponse appointment = appointmentService.getAppointmentDetail(Long.parseLong(userId), id);

        return ResponseEntity.ok(appointment);
    }

    @GetMapping("/me")
    public ResponseEntity<List<AppointmentResponse>> getMyAppointments(
            @AuthenticationPrincipal String userId) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<AppointmentResponse> appointments = appointmentService.getMyAppointments(Long.parseLong(userId));

        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/feed")
    public ResponseEntity<List<FeedResponse>> getPublicFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("공개 피드 조회 요청 - 페이지: {}, 사이즈: {}", page, size);

        List<FeedResponse> feed = appointmentService.getPublicFeed(page, size);

        return ResponseEntity.ok(feed);
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelAppointment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        appointmentService.cancelAppointment(Long.parseLong(userId), id);

        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/{id}/complete", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Void> completeAppointment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id,
            @RequestPart(value = "files", required = false) List<org.springframework.web.multipart.MultipartFile> files,
            @Valid @RequestPart("request") AppointmentCompleteRequest request) {

        log.info("요청 수신됨: ID = {}", id);
        log.info("수신된 DTO 객체: {}", request);
        if (files != null) {
            log.info("수신된 파일 개수: {}", files.size());
            files.forEach(file -> log.info("파일 원본 이름: {}", file.getOriginalFilename()));
        } else {
            log.info("수신된 파일 리스트가 null입니다.");
        }

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        appointmentService.completeAppointment(Long.parseLong(userId), id, files, request);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<AppointmentDto> cloneAppointment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Appointment newAppointment = appointmentService.cloneAppointment(id, user);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AppointmentDto.from(newAppointment));
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<Void> toggleFavorite(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        appointmentService.toggleFavorite(Long.parseLong(userId), id);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/arrive")
    public ResponseEntity<AppointmentDto> markAsArrived(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Appointment updatedAppointment = appointmentService.markAsArrived(Long.parseLong(userId), id);

        return ResponseEntity.ok(AppointmentDto.from(updatedAppointment));
    }

    @PatchMapping("/{id}/swap")
    public ResponseEntity<AppointmentResponse> swapMission(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("미션 교체 요청 - 사용자: {}, 약속 ID: {}", userId, id);

        AppointmentResponse swappedAppointment = appointmentService.swapMission(Long.parseLong(userId), id);

        return ResponseEntity.ok(swappedAppointment);
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDeleteAppointments(
            @AuthenticationPrincipal String userId,
            @RequestBody List<Long> appointmentIds) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        appointmentService.bulkDeleteAppointments(Long.parseLong(userId), appointmentIds);

        return ResponseEntity.ok().build();
    }

    // ========================================
    // 개발용 엔드포인트 (테스트 전용)
    // ========================================

    /**
     * 개발용: 약속 날짜를 내일(D-1)로 변경
     * 미션 공개 알림 테스트용
     */
    @PutMapping("/{id}/dev/unlock-tomorrow")
    public ResponseEntity<AppointmentDto> unlockTomorrow(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.warn("⚠️ 개발용 API 호출: 약속 날짜를 내일로 변경 (ID: {})", id);

        Appointment appointment = appointmentService.unlockTomorrow(Long.parseLong(userId), id);

        return ResponseEntity.ok(AppointmentDto.from(appointment));
    }

    /**
     * 개발용: 약속 날짜를 현재 시간으로 변경
     * 인증/완료 기능 테스트용
     */
    @PutMapping("/{id}/dev/unlock-now")
    public ResponseEntity<AppointmentDto> unlockNow(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id) {

        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.warn("⚠️ 개발용 API 호출: 약속 날짜를 현재 시간으로 변경 (ID: {})", id);

        Appointment appointment = appointmentService.unlockNow(Long.parseLong(userId), id);

        return ResponseEntity.ok(AppointmentDto.from(appointment));
    }
}
