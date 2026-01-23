package com.littleescape.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AppointmentCompleteRequest(
    @Size(min = 10, message = "리뷰는 최소 10자 이상 작성해주세요")
    String proofComment,

    @NotNull(message = "감성 키워드 리스트는 null일 수 없습니다")
    @NotEmpty(message = "감성 키워드를 최소 1개 이상 선택해주세요")
    List<String> reviewKeywords
) {
}
