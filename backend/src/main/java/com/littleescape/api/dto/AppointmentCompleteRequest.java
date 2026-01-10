package com.littleescape.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AppointmentCompleteRequest(
    @NotBlank(message = "증명 이미지 URL은 필수입니다")
    @Size(max = 500, message = "증명 이미지 URL은 500자 이하여야 합니다")
    String proofImageUrl,

    String comment
) {
}
