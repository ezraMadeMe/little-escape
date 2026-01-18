package com.littleescape.api.controller;

import com.littleescape.api.auth.JwtProvider;
import com.littleescape.api.domain.User;
import com.littleescape.api.dto.OnboardingRequest;
import com.littleescape.api.dto.UserResponse;
import com.littleescape.api.repository.UserRepository;
import com.littleescape.api.service.SmsService;
import com.littleescape.api.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final SmsService smsService;
    private final JwtProvider jwtProvider;

    @Value("${app.magic-link.base-url}")
    private String magicLinkBaseUrl;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal String userId) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(UserResponse.from(user));
    }

    /**
     * 테스트용 매직 링크 SMS 발송 API
     * 현재 로그인한 유저에게 매직 링크를 SMS로 전송합니다.
     *
     * @param userId 인증된 사용자의 User ID
     * @return 성공 메시지
     */
    @PostMapping("/send-magic-link")
    public ResponseEntity<Map<String, String>> sendMagicLink(@AuthenticationPrincipal String userId) {
        log.info("=== 매직 링크 SMS 발송 요청 ===");

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "인증이 필요합니다."));
        }

        // 1. 현재 로그인한 유저 조회
        User user = userRepository.findById(Long.parseLong(userId))
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
     * @param userId 인증된 사용자의 User ID
     * @param request 대상 전화번호를 담은 Map (키: targetPhoneNumber)
     * @return 성공 메시지
     */
    @PostMapping("/invite")
    public ResponseEntity<Map<String, String>> inviteFriend(
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, String> request) {
        log.info("=== 친구 초대 SMS 발송 요청 ===");

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "인증이 필요합니다."));
        }

        // 1. 현재 로그인한 유저 조회
        User user = userRepository.findById(Long.parseLong(userId))
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

    /**
     * 닉네임 중복 체크 API
     */
    @GetMapping("/check-nickname")
    public ResponseEntity<Map<String, Boolean>> checkNickname(@RequestParam String nickname) {
        boolean isAvailable = userService.isNicknameAvailable(nickname);
        return ResponseEntity.ok(Map.of("available", isAvailable));
    }

    /**
     * 랜덤 닉네임 생성 API (형용사 + 기존 이름)
     */
    @GetMapping("/random-nickname")
    public ResponseEntity<Map<String, String>> getRandomNickname(@AuthenticationPrincipal String userId) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        String randomNickname = userService.generateRandomNickname(user.getNickname());
        return ResponseEntity.ok(Map.of("nickname", randomNickname));
    }

    /**
     * 온보딩 완료 (프로필 업데이트 + isOnboarded = true)
     * 계정 통합 시 새로운 JWT 토큰 발급
     */
    @PostMapping("/onboarding")
    public ResponseEntity<Map<String, Object>> completeOnboarding(
            @AuthenticationPrincipal String userId,
            @RequestPart("data") OnboardingRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User updatedUser = userService.completeOnboarding(Long.parseLong(userId), request, profileImage);

        // 계정 통합이 발생하면 userId가 변경되므로 새로운 JWT 토큰 발급
        String newToken = jwtProvider.createToken(String.valueOf(updatedUser.getId()), updatedUser.getRole().name());

        return ResponseEntity.ok(Map.of(
                "user", UserResponse.from(updatedUser),
                "token", newToken
        ));
    }

    /**
     * 프로필 수정 API
     */
    @PatchMapping("/profile")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal String userId,
            @RequestPart("data") OnboardingRequest request,
            @RequestPart(value = "profileImage", required = false) MultipartFile profileImage) {

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User updatedUser = userService.updateProfile(Long.parseLong(userId), request, profileImage);

        return ResponseEntity.ok(UserResponse.from(updatedUser));
    }

    /**
     * 채팅 온보딩 사용자 선호도 업데이트 API
     * (nickname, MBTI, 혼밥 레벨)
     */
    @PostMapping("/preferences")
    public ResponseEntity<UserResponse> updateUserPreferences(
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, Object> request) {

        log.info("=== 사용자 선호도 업데이트 API 호출 ===");
        log.info("인증된 사용자 ID: {}", userId);
        log.info("요청 데이터: {}", request);

        if (userId == null || userId.isEmpty()) {
            log.error("❌ 사용자 ID가 없습니다 (인증 실패)");
            return ResponseEntity.status(401).build();
        }

        String nickname = (String) request.get("nickname");
        String mbti = (String) request.get("mbti");
        Integer soloLevel = request.get("soloLevel") != null 
            ? ((Number) request.get("soloLevel")).intValue() 
            : null;

        log.info("파싱된 데이터 - 닉네임: {}, MBTI: {}, 혼밥레벨: {}", nickname, mbti, soloLevel);

        try {
            User updatedUser = userService.updateUserPreferences(
                Long.parseLong(userId), 
                nickname, 
                mbti, 
                soloLevel
            );

            log.info("✅ 사용자 선호도 업데이트 성공: {}", updatedUser.getId());
            return ResponseEntity.ok(UserResponse.from(updatedUser));
        } catch (NumberFormatException e) {
            log.error("❌ 사용자 ID 파싱 실패: {}", userId, e);
            return ResponseEntity.status(400).body(null);
        } catch (RuntimeException e) {
            log.error("❌ 사용자 선호도 업데이트 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(null);
        }
    }

    /**
     * 회원탈퇴 API
     */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteUser(@AuthenticationPrincipal String userId) {
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        userService.deleteUser(Long.parseLong(userId));

        return ResponseEntity.ok().build();
    }

    /**
     * 문의하기 이메일 발송 API
     */
    @PostMapping("/contact")
    public ResponseEntity<Map<String, String>> sendContactEmail(
            @AuthenticationPrincipal String userId,
            @RequestPart("data") Map<String, String> data,
            @RequestPart(value = "images", required = false) MultipartFile[] images) {

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        String subject = data.get("subject");
        String content = data.get("content");

        userService.sendContactEmail(user, subject, content, images);

        return ResponseEntity.ok(Map.of("message", "문의가 접수되었습니다."));
    }
}
