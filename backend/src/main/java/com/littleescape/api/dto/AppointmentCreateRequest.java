package com.littleescape.api.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record AppointmentCreateRequest(
        @NotNull(message = "약속 시간은 필수입니다.")
        LocalDateTime scheduledAt,
        Long missionId,
        Double userLatitude,
        Double userLongitude,
        Integer searchRadius
) {
    private static final Double DEFAULT_LATITUDE = 37.544;
    private static final Double DEFAULT_LONGITUDE = 127.056;

    public Double getUserLatitude() {
        return userLatitude != null ? userLatitude : DEFAULT_LATITUDE;
    }

    public Double getUserLongitude() {
        return userLongitude != null ? userLongitude : DEFAULT_LONGITUDE;
    }
}
