package com.littleescape.api.dto;

import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.OAuthProvider;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String nickname;
    private OAuthProvider oauthProvider;
    private String oauthId;

    public static UserDto from(User user) {
        return new UserDto(
            user.getId(),
            user.getNickname(),
            user.getOauthProvider(),
            user.getOauthId()
        );
    }
}
