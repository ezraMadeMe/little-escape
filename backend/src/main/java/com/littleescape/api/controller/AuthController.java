package com.littleescape.api.controller;

import com.littleescape.api.auth.JwtProvider;
import com.littleescape.api.domain.User;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;

    /**
     * 매직 링크 로그인 엔드포인트
     *
     * @param requestBody {"token": "magic-token-string"}
     * @return {"accessToken": "jwt-token"}
     */
    @PostMapping("/magic-login")
    public ResponseEntity<Map<String, String>> magicLogin(@RequestBody Map<String, String> requestBody) {
        String token = requestBody.get("token");

        log.info("=== 매직 링크 로그인 시도 ===");
        log.info("Token: {}", token);

        if (token == null || token.isEmpty()) {
            log.warn("토큰이 제공되지 않음");
            return ResponseEntity.badRequest().body(Map.of("error", "토큰이 필요합니다."));
        }

        // 1. DB에서 해당 매직 토큰을 가진 유저 찾기
        User user = userRepository.findByMagicToken(token)
                .orElseThrow(() -> {
                    log.warn("유효하지 않은 토큰: {}", token);
                    return new RuntimeException("유효하지 않은 토큰입니다.");
                });

        // 2. 토큰 만료 시간 확인
        LocalDateTime now = LocalDateTime.now();
        if (user.getMagicTokenExpiry() == null || user.getMagicTokenExpiry().isBefore(now)) {
            log.warn("만료된 토큰 - User: {}, Expiry: {}, Now: {}",
                    user.getEmail(), user.getMagicTokenExpiry(), now);

            throw new RuntimeException("만료된 토큰입니다.");
        }

        // 3. 토큰이 유효함 (약속 생성 시에만 토큰 제거하도록 변경)
        log.info("유효한 토큰 확인 - User: {} ({})", user.getNickname(), user.getEmail());

        // 4. JWT 액세스 토큰 생성
        String accessToken = jwtProvider.createToken(user.getOauthId(), "USER");

        log.info("=== 매직 링크 로그인 성공 ===");
        log.info("User: {} (ID: {})", user.getEmail(), user.getId());

        // 5. 액세스 토큰 반환
        return ResponseEntity.ok(Map.of("accessToken", accessToken));
    }
}
