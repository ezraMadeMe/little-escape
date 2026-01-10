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

        // Extract email and providerId based on provider
        String email;
        String providerId;

        if ("google".equalsIgnoreCase(registrationId)) {
            email = (String) attributes.get("email");
            providerId = (String) attributes.get("sub");
        } else if ("kakao".equalsIgnoreCase(registrationId)) {
            providerId = attributes.get("id").toString();
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            email = kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
        } else if ("naver".equalsIgnoreCase(registrationId)) {
            // Naver has nested structure: response contains actual user data
            Map<String, Object> responseMap = (Map<String, Object>) attributes.get("response");
            if (responseMap == null) {
                throw new IllegalStateException("네이버 응답 데이터를 찾을 수 없습니다.");
            }
            providerId = (String) responseMap.get("id");
            email = (String) responseMap.get("email");
        } else {
            throw new IllegalStateException("지원하지 않는 OAuth2 제공자입니다: " + registrationId);
        }

        // Find user by email (CustomOAuth2UserService already created/updated the user)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다: " + email));

        log.info("사용자 확인: {} (ID: {})", user.getEmail(), user.getId());

        // Generate JWT token using oauthId
        String role = "USER";
        String accessToken = jwtProvider.createToken(user.getOauthId(), role);

        log.info("JWT 토큰 생성 완료");

        // Redirect to frontend with token as query parameter
        // NOTE: application.yml의 app.oauth2.authorized-redirect-uri에서 설정 가능
        String redirectUrl = UriComponentsBuilder.fromUriString(authorizedRedirectUri)
                .queryParam("token", accessToken)
                .build()
                .toUriString();

        log.info("리다이렉트 URL: {}", redirectUrl);

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}