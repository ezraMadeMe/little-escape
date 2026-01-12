package com.littleescape.api.auth;

import com.littleescape.api.domain.User;
import com.littleescape.api.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Value("${app.oauth2.authorized-redirect-uri}")
    private String authorizedRedirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;

        String registrationId = oauthToken.getAuthorizedClientRegistrationId();
        Map<String, Object> attributes = oAuth2User.getAttributes();

        log.info("=== OAuth2 로그인 성공 핸들러 ===");
        log.info("Provider: {}", registrationId);

        // Extract providerId based on provider
        String providerId;

        if ("google".equalsIgnoreCase(registrationId)) {
            providerId = (String) attributes.get("sub");
        } else if ("kakao".equalsIgnoreCase(registrationId)) {
            providerId = attributes.get("id").toString();
        } else if ("naver".equalsIgnoreCase(registrationId)) {
            Map<String, Object> responseMap = (Map<String, Object>) attributes.get("response");
            if (responseMap == null) {
                throw new IllegalStateException("네이버 응답 데이터를 찾을 수 없습니다.");
            }
            providerId = (String) responseMap.get("id");
        } else {
            throw new IllegalStateException("지원하지 않는 OAuth2 제공자입니다: " + registrationId);
        }

        // Find user by social ID (CustomOAuth2UserService already created/updated the user)
        User user = findBySocialId(registrationId, providerId);

        if (user == null) {
            throw new IllegalStateException("사용자를 찾을 수 없습니다. Provider: " + registrationId + ", ID: " + providerId);
        }

        log.info("사용자 확인: {} (ID: {}, Role: {})", user.getNickname(), user.getId(), user.getRole());

        // Generate JWT token with actual user role
        String accessToken = jwtProvider.createToken(String.valueOf(user.getId()), user.getRole().name());

        log.info("JWT 토큰 생성 완료 (Role: {})", user.getRole());

        // Redirect to frontend with token as query parameter
        String redirectUrl = UriComponentsBuilder.fromUriString(authorizedRedirectUri)
                .queryParam("token", accessToken)
                .build()
                .toUriString();

        log.info("리다이렉트 URL: {}", redirectUrl);

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
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
