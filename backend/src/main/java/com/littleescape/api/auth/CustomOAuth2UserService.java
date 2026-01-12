package com.littleescape.api.auth;

import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.Role;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        log.info("=== OAuth2 로그인 시작 ===");
        log.info("Provider: {}", registrationId);
        log.info("Attributes: {}", attributes);

        // Extract user info based on provider
        String email;
        String providerId;
        String nickname;
        String profileImageUrl;

        if ("google".equalsIgnoreCase(registrationId)) {
            email = (String) attributes.get("email");
            providerId = (String) attributes.get("sub");
            nickname = (String) attributes.get("name");
            profileImageUrl = (String) attributes.get("picture");

        } else if ("kakao".equalsIgnoreCase(registrationId)) {
            providerId = attributes.get("id").toString();

            // Kakao has nested structure: kakao_account -> email
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;

            // Nickname and profile image from properties
            Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
            nickname = properties != null ? (String) properties.get("nickname") : "사용자";
            profileImageUrl = properties != null ? (String) properties.get("profile_image") : null;

        } else if ("naver".equalsIgnoreCase(registrationId)) {
            // Naver has nested structure: response contains actual user data
            Map<String, Object> responseMap = (Map<String, Object>) attributes.get("response");

            if (responseMap == null) {
                throw new OAuth2AuthenticationException("네이버 응답 데이터를 찾을 수 없습니다.");
            }

            providerId = (String) responseMap.get("id");
            email = (String) responseMap.get("email");
            nickname = (String) responseMap.get("name");
            profileImageUrl = (String) responseMap.get("profile_image");

            // If name is not available, use nickname
            if (nickname == null || nickname.isEmpty()) {
                nickname = (String) responseMap.get("nickname");
            }
            if (nickname == null || nickname.isEmpty()) {
                nickname = "사용자";
            }

        } else {
            throw new OAuth2AuthenticationException("지원하지 않는 OAuth2 제공자입니다: " + registrationId);
        }

        log.info("추출된 정보 - Email: {}, ProviderId: {}, Nickname: {}, ProfileImage: {}", email, providerId, nickname, profileImageUrl);

        // 1. 소셜 ID로 먼저 찾기
        User user = findBySocialId(registrationId, providerId);

        // 2. 없으면 신규 GUEST 유저 생성 (온보딩 필요)
        if (user == null) {
            log.info("새 GUEST 사용자 생성 - Provider: {}, ProviderId: {}", registrationId, providerId);
            user = new User();
            user.setSocialId(registrationId, providerId);
            user.setNickname(nickname != null ? nickname : "사용자");
            user.setProfileImageUrl(profileImageUrl);
            user.setEmail(email);  // null 가능
            user.setRole(Role.GUEST);  // 임시 회원
            user.setOnboarded(false);
            user = userRepository.save(user);
        } else {
            // 3. 기존 유저 정보 업데이트
            log.info("기존 사용자 업데이트 - User ID: {}", user.getId());
            user.update(nickname, profileImageUrl);
            if (email != null) {
                user.setEmail(email);
            }
            user = userRepository.save(user);
        }

        log.info("=== OAuth2 로그인 완료 (User ID: {}, Role: {}) ===", user.getId(), user.getRole());

        return oAuth2User;
    }

    /**
     * 소셜 ID로 사용자 찾기 (Provider별 분기)
     */
    private User findBySocialId(String provider, String socialId) {
        switch (provider.toLowerCase()) {
            case "kakao":
                return userRepository.findByKakaoId(socialId).orElse(null);
            case "google":
                return userRepository.findByGoogleId(socialId).orElse(null);
            case "naver":
                return userRepository.findByNaverId(socialId).orElse(null);
            default:
                return null;
        }
    }
}
