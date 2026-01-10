package com.littleescape.api.auth;

import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.OAuthProvider;
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
        OAuthProvider provider;

        if ("google".equalsIgnoreCase(registrationId)) {
            provider = OAuthProvider.GOOGLE;
            email = (String) attributes.get("email");
            providerId = (String) attributes.get("sub");
            nickname = (String) attributes.get("name");
            profileImageUrl = (String) attributes.get("picture");

        } else if ("kakao".equalsIgnoreCase(registrationId)) {
            provider = OAuthProvider.KAKAO;
            providerId = attributes.get("id").toString();

            // Kakao has nested structure: kakao_account -> email
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;

            // Nickname and profile image from properties
            Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
            nickname = properties != null ? (String) properties.get("nickname") : "사용자";
            profileImageUrl = properties != null ? (String) properties.get("profile_image") : null;

        } else if ("naver".equalsIgnoreCase(registrationId)) {
            provider = OAuthProvider.NAVER;

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

        // Generate oauthId (provider_providerId format for uniqueness)
        String oauthId = provider.name().toLowerCase() + "_" + providerId;

        // Lambda에서 사용하기 위해 effectively final 변수 생성
        String finalNickname = nickname;
        String finalProfileImageUrl = profileImageUrl;
        String finalEmail = email;

        // Find or create user by oauthId (unique key)
        User user = userRepository.findByOauthId(oauthId)
                .map(existingUser -> {
                    // Update existing user info using the update method
                    log.info("기존 사용자 업데이트 (OAuth ID: {}): {}", oauthId, finalEmail);
                    existingUser.update(finalNickname, finalProfileImageUrl);
                    // Also update email in case it changed
                    existingUser.setEmail(finalEmail);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Create new user
                    log.info("새 사용자 생성 (OAuth ID: {}): {}", oauthId, finalEmail);
                    User newUser = new User();
                    newUser.setEmail(finalEmail);
                    newUser.setOauthId(oauthId);
                    newUser.setOauthProvider(provider);
                    newUser.setProviderId(providerId);
                    newUser.setNickname(finalNickname);
                    newUser.setProfileImageUrl(finalProfileImageUrl);
                    return userRepository.save(newUser);
                });

        log.info("=== OAuth2 로그인 완료 (User ID: {}, OAuth ID: {}) ===", user.getId(), oauthId);

        return oAuth2User;
    }
}
