package com.littleescape.api.dto;

public record OnboardingRequest(
    String nickname,
    String email,
    String phoneNumber
) {
}
