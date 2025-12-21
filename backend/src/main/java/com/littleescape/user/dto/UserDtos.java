package com.littleescape.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class UserDtos {

    public record MeResponse(Long userId, String nickname) {}

    public record UpdatePreferenceRequest(
            List<String> preferredTags,
            List<String> avoidTags,
            @NotBlank String defaultMode,
            @Min(0) @Max(1) double explorationRate
    ) {}
}