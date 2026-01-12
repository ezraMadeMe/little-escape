package com.littleescape.api.repository;

import com.littleescape.api.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    // 소셜 ID 조회
    Optional<User> findByKakaoId(String kakaoId);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByNaverId(String naverId);

    // 휴대폰 번호 조회
    Optional<User> findByPhoneNumber(String phoneNumber);

    // 닉네임 중복 체크
    boolean existsByNickname(String nickname);

    // Legacy methods (deprecated)
    @Deprecated
    Optional<User> findByOauthId(String oauthId);
    @Deprecated
    Optional<User> findByEmail(String email);

    Optional<User> findByMagicToken(String magicToken);
}
