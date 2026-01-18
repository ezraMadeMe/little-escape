package com.littleescape.api.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record AppointmentCompleteRequest(
    String proofComment,

    @NotNull(message = "감성 키워드 리스트는 null일 수 없습니다")
    List<String> reviewKeywords
) {
}
