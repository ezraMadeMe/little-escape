package com.littleescape.api.dto;

import jakarta.validation.constraints.NotNull;

public record AppointmentMissionUpdateRequest(
    @NotNull(message = "미션 ID는 필수입니다")
    Long missionId
) {
}
