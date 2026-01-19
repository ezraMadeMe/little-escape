package com.littleescape.api.dto;

import com.littleescape.api.domain.User;

public record UserResponse(
    Long id,
    String nickname,
    String email,
    String profileImageUrl,
    String phoneNumber,
    boolean isOnboarded,
    String role,
    String mbti,
    Integer soloLevel,
    String tags
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getNickname(),
            user.getEmail(),
            user.getProfileImageUrl(),
            user.getPhoneNumber(),
            user.isOnboarded(),
            user.getRole().name(),
            user.getMbti(),
            user.getSoloLevel(),
            user.getTags()
        );
    }
}
