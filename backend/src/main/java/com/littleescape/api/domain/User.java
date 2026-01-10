package com.littleescape.api.domain;

import com.littleescape.api.domain.type.OAuthProvider;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "oauth_provider", nullable = false)
    private OAuthProvider oauthProvider;

    @Column(name = "oauth_id", nullable = false, unique = true)
    private String oauthId;

    @Column(nullable = false)
    private String nickname;

    @Column(unique = true)
    private String email;

    @Column(name = "provider_id")
    private String providerId;

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "magic_token", unique = true)
    private String magicToken;

    @Column(name = "magic_token_expiry")
    private LocalDateTime magicTokenExpiry;

    /**
     * 사용자 정보 업데이트 메서드
     * OAuth 로그인 시 닉네임 및 프로필 이미지 업데이트에 사용
     *
     * @param nickname 새로운 닉네임
     * @param profileImageUrl 새로운 프로필 이미지 URL
     * @return 업데이트된 User 객체 (메서드 체이닝 가능)
     */
    public User update(String nickname, String profileImageUrl) {
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        return this;
    }
}
