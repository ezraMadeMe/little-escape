package com.littleescape.api.dto;

import com.littleescape.api.domain.User;

public record UserResponse(
    Long id,
    String nickname,
    String email,
    String profileImageUrl
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getNickname(),
            user.getEmail(),
            user.getProfileImageUrl()
        );
    }
}
