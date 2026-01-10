package com.littleescape.api.service;

import com.littleescape.api.domain.User;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * 매직 링크 토큰 생성
     *
     * @param userId 사용자 ID
     * @return 생성된 매직 토큰 문자열
     */
    @Transactional
    public String createMagicToken(Long userId) {
        log.info("=== 매직 토큰 생성 시작 - User ID: {} ===", userId);

        // 사용자 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다. ID: " + userId));

        // UUID로 유니크한 토큰 생성
        String magicToken = UUID.randomUUID().toString();

        // 만료 시간 설정 (현재시간 + 1년으로 개발중 > 추후 짧게 변경 가능)
        LocalDateTime expiry = LocalDateTime.now().plusYears(1);

        // 사용자에게 토큰 및 만료 시간 저장
        user.setMagicToken(magicToken);
        user.setMagicTokenExpiry(expiry);

        userRepository.save(user);

        log.info("=== 매직 토큰 생성 완료 ===");
        log.info("User: {} ({}), Token: {}, Expiry: {}", user.getNickname(), user.getEmail(), magicToken, expiry);

        return magicToken;
    }
}
