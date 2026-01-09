package com.littleescape.api.auth;

import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.OAuthProvider;
import com.littleescape.api.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtProvider jwtProvider;
    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String oauthId = oAuth2User.getAttribute("id").toString();
        String nickname = oAuth2User.getAttribute("properties") != null
                ? ((java.util.Map<String, Object>) oAuth2User.getAttribute("properties")).get("nickname").toString()
                : "사용자";

        User user = userRepository.findByOauthId(oauthId)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setOauthId(oauthId);
                    newUser.setOauthProvider(OAuthProvider.KAKAO);
                    newUser.setNickname(nickname);
                    return userRepository.save(newUser);
                });

        if (!user.getNickname().equals(nickname)) {
            user.setNickname(nickname);
            userRepository.save(user);
        }

        String role = "USER";
        String accessToken = jwtProvider.createToken(oauthId, role);

        // 현재 요청이 들어온 서버 IP(백엔드 IP)를 기반으로 프론트엔드 주소 생성
        // 개발 환경에서는 프론트/백이 같은 IP를 사용한다고 가정 (포트만 다름)
        String currentServerIp = request.getServerName();
        String frontendRedirectUrl = "http://" + currentServerIp + ":5173/auth/callback";

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUrl)
                .queryParam("token", accessToken)
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}