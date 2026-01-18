package com.littleescape.api.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AppointmentCreateRequest(
    @NotNull(message = "약속 시간은 필수입니다")
    LocalDateTime scheduledAt,
    Long missionId,  // 선택적 필드 (null 가능)
    Double userLatitude,  // 사용자 위도 (null이면 기본값 사용)
    Double userLongitude  // 사용자 경도 (null이면 기본값 사용)
) {
    // 기본 위치: 서울 성수동 (37.544, 127.056)
    private static final Double DEFAULT_LATITUDE = 37.544;
    private static final Double DEFAULT_LONGITUDE = 127.056;

    public Double getUserLatitude() {
        return userLatitude != null ? userLatitude : DEFAULT_LATITUDE;
    }

    public Double getUserLongitude() {
        return userLongitude != null ? userLongitude : DEFAULT_LONGITUDE;
    }
}
