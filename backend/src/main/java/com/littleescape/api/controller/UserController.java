package com.littleescape.api.controller;

import com.littleescape.api.domain.User;
import com.littleescape.api.dto.UserResponse;
import com.littleescape.api.repository.UserRepository;
import com.littleescape.api.service.SmsService;
import com.littleescape.api.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final SmsService smsService;

    @Value("${app.magic-link.base-url}")
    private String magicLinkBaseUrl;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal String oauthId) {
        if (oauthId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * 테스트용 매직 링크 SMS 발송 API
     * 현재 로그인한 유저에게 매직 링크를 SMS로 전송합니다.
     *
     * @param oauthId 인증된 사용자의 OAuth ID
     * @return 성공 메시지
     */
    @PostMapping("/send-magic-link")
    public ResponseEntity<Map<String, String>> sendMagicLink(@AuthenticationPrincipal String oauthId) {
        log.info("=== 매직 링크 SMS 발송 요청 ===");

        if (oauthId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "인증이 필요합니다."));
        }

        // 1. 현재 로그인한 유저 조회
        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 2. 전화번호 확인
        if (user.getPhoneNumber() == null || user.getPhoneNumber().isEmpty()) {
            log.warn("전화번호가 등록되지 않은 유저: {}", user.getId());
            return ResponseEntity.badRequest().body(Map.of("error", "전화번호가 등록되지 않았습니다."));
        }

        // 3. 매직 토큰 생성
        String magicToken = userService.createMagicToken(user.getId());

        // 4. 매직 링크 생성
        // NOTE: application.yml의 app.magic-link.base-url에서 설정 가능
        String magicLink = String.format("%s/magic-login?token=%s", magicLinkBaseUrl, magicToken);

        log.info("생성된 매직 링크: {}", magicLink);

        // 5. SMS 발송
        smsService.sendMagicLinkSms(user.getPhoneNumber(), magicLink);

        log.info("=== 매직 링크 SMS 발송 완료 - User: {} ({}) ===", user.getNickname(), user.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "매직 링크가 SMS로 발송되었습니다.",
                "phoneNumber", user.getPhoneNumber()
        ));
    }

    /**
     * 친구 초대 SMS 발송 API
     * 현재 로그인한 유저가 친구의 전화번호로 초대 메시지를 전송합니다.
     *
     * @param oauthId 인증된 사용자의 OAuth ID
     * @param request 대상 전화번호를 담은 Map (키: targetPhoneNumber)
     * @return 성공 메시지
     */
    @PostMapping("/invite")
    public ResponseEntity<Map<String, String>> inviteFriend(
            @AuthenticationPrincipal String oauthId,
            @RequestBody Map<String, String> request) {
        log.info("=== 친구 초대 SMS 발송 요청 ===");

        if (oauthId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "인증이 필요합니다."));
        }

        // 1. 현재 로그인한 유저 조회
        User user = userRepository.findByOauthId(oauthId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 2. 대상 전화번호 확인
        String targetPhoneNumber = request.get("targetPhoneNumber");
        if (targetPhoneNumber == null || targetPhoneNumber.trim().isEmpty()) {
            log.warn("전화번호가 입력되지 않음");
            return ResponseEntity.badRequest().body(Map.of("error", "전화번호를 입력해주세요."));
        }

        // 3. 초대 메시지 생성
        String nickname = user.getNickname() != null ? user.getNickname() : "누군가";
        String message = String.format(
                "[작은 일탈] %s님이 당신을 쉼의 시간으로 초대했습니다. 🌿 함께 일상에서 벗어나 볼까요? 👉 https://garrett-unmaniacal-raelyn.ngrok-free.dev",
                nickname
        );

        log.info("초대 메시지: {}", message);

        // 4. SMS 발송
        smsService.sendSms(targetPhoneNumber, message);

        log.info("=== 친구 초대 SMS 발송 완료 - From: {} ({}) To: {} ===",
                user.getNickname(), user.getEmail(), targetPhoneNumber);

        return ResponseEntity.ok(Map.of("message", "초대장 발송 완료"));
    }
}
