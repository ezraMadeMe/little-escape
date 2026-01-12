package com.littleescape.api.domain;

import com.littleescape.api.domain.type.OAuthProvider;
import com.littleescape.api.domain.type.Role;
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

    // 소셜 로그인 ID들 (각각 unique, nullable)
    @Column(name = "kakao_id", unique = true)
    private String kakaoId;

    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(name = "naver_id", unique = true)
    private String naverId;

    // 핵심 식별자: 휴대폰 번호 (One Person One Account)
    @Column(name = "phone_number", unique = true)
    private String phoneNumber;

    // 기본 정보
    @Column(nullable = false)
    private String nickname;

    @Column
    private String email;  // 연락용, 식별자 아님

    @Column(name = "profile_image_url")
    private String profileImageUrl;

    // 권한 및 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.GUEST;

    @Column(name = "is_onboarded", nullable = false)
    private boolean isOnboarded = false;

    // Legacy fields (deprecated, 하위 호환성 유지)
    @Deprecated
    @Enumerated(EnumType.STRING)
    @Column(name = "oauth_provider")
    private OAuthProvider oauthProvider;

    @Deprecated
    @Column(name = "oauth_id")
    private String oauthId;

    @Deprecated
    @Column(name = "provider_id")
    private String providerId;

    @Column(name = "magic_token", unique = true)
    private String magicToken;

    @Column(name = "magic_token_expiry")
    private LocalDateTime magicTokenExpiry;

    /**
     * 소셜 ID 기반으로 사용자 검색 (Kakao, Google, Naver 통합)
     */
    public static User findBySocialId(String provider, String socialId) {
        // This is a placeholder - actual implementation in repository
        return null;
    }

    /**
     * 소셜 ID 설정 (provider에 따라 적절한 필드에 저장)
     */
    public void setSocialId(String provider, String socialId) {
        switch (provider.toLowerCase()) {
            case "kakao":
                this.kakaoId = socialId;
                break;
            case "google":
                this.googleId = socialId;
                break;
            case "naver":
                this.naverId = socialId;
                break;
        }
    }

    /**
     * 소셜 ID 조회
     */
    public String getSocialId(String provider) {
        switch (provider.toLowerCase()) {
            case "kakao":
                return this.kakaoId;
            case "google":
                return this.googleId;
            case "naver":
                return this.naverId;
            default:
                return null;
        }
    }

    /**
     * 사용자 정보 업데이트 메서드
     */
    public User update(String nickname, String profileImageUrl) {
        if (nickname != null) {
            this.nickname = nickname;
        }
        if (profileImageUrl != null) {
            this.profileImageUrl = profileImageUrl;
        }
        return this;
    }

    /**
     * 온보딩 완료 처리
     */
    public void completeOnboarding() {
        this.isOnboarded = true;
        this.role = Role.USER;
    }
}
