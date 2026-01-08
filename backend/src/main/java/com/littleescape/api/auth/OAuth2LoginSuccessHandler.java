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
    private static final String FRONTEND_REDIRECT_URL = "http://localhost:5173/auth/callback";

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

        String redirectUrl = UriComponentsBuilder.fromUriString(FRONTEND_REDIRECT_URL)
                .queryParam("token", accessToken)
                .build()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
