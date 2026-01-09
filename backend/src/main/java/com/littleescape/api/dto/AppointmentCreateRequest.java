package com.littleescape.api.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AppointmentCreateRequest(
    @NotNull(message = "약속 시간은 필수입니다")
    LocalDateTime scheduledAt,
    Long missionId  // 선택적 필드 (null 가능)
) {
}
