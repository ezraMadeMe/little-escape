package com.littleescape.api.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AppointmentCompleteRequest(
    String proofComment,

    @NotEmpty(message = "최소 1개 이상의 감성 키워드를 선택해주세요")
    List<String> reviewKeywords
) {
}
