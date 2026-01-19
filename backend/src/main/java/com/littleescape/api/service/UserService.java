package com.littleescape.api.service;

import com.littleescape.api.domain.Adjective;
import com.littleescape.api.domain.User;
import com.littleescape.api.dto.OnboardingRequest;
import com.littleescape.api.repository.AdjectiveRepository;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AdjectiveRepository adjectiveRepository;
    private final AppointmentRepository appointmentRepository;
    private final JavaMailSender mailSender;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

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

    /**
     * 닉네임 중복 체크
     */
    public boolean isNicknameAvailable(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    /**
     * 랜덤 닉네임 생성 (형용사 + 기존 이름)
     */
    public String generateRandomNickname(String originalName) {
        Adjective adjective = adjectiveRepository.findRandomAdjective()
                .orElse(new Adjective("멋진"));

        String baseName = originalName != null ? originalName : "사용자";
        return adjective.getWord() + " " + baseName;
    }

    /**
     * 온보딩 완료 처리 (계정 통합 로직 포함)
     */
    @Transactional
    public User completeOnboarding(Long userId, OnboardingRequest request, MultipartFile profileImage) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("=== 온보딩 완료 처리 시작 - User ID: {}, Phone: {} ===", userId, request.phoneNumber());

        // 1. 휴대폰 번호로 기존 계정 확인 (계정 통합 체크)
        User existingUser = null;
        if (request.phoneNumber() != null) {
            existingUser = userRepository.findByPhoneNumber(request.phoneNumber()).orElse(null);
        }

        // 2. 기존 계정이 있고, 다른 사용자인 경우 → 계정 통합 (Merge)
        if (existingUser != null && !existingUser.getId().equals(userId)) {
            log.info("=== 계정 통합 시작 - 기존 계정: {}, 신규 계정: {} ===", existingUser.getId(), userId);

            // 2-1. 소셜 ID 통합 (현재 GUEST 계정의 소셜 ID를 기존 계정에 병합)
            mergeSocialIds(currentUser, existingUser);

            // 2-2. 닉네임 및 프로필 이미지 업데이트 (신규 정보 반영)
            if (request.nickname() != null) {
                if (!isNicknameAvailable(request.nickname()) && !request.nickname().equals(existingUser.getNickname())) {
                    throw new RuntimeException("이미 사용 중인 닉네임입니다.");
                }
                existingUser.setNickname(request.nickname());
            }

            // 이메일 업데이트 (이미 같은 이메일이 아닌 경우에만)
            if (request.email() != null && !request.email().equals(existingUser.getEmail())) {
                // 이메일 중복 체크
                if (userRepository.findByEmail(request.email()).isPresent()) {
                    log.warn("이메일 중복으로 인한 업데이트 스킵: {}", request.email());
                } else {
                    existingUser.setEmail(request.email());
                }
            }

            if (profileImage != null && !profileImage.isEmpty()) {
                String imageUrl = saveProfileImage(profileImage);
                existingUser.setProfileImageUrl(imageUrl);
            }

            // 2-3. 기존 계정 온보딩 완료 처리
            existingUser.completeOnboarding();
            userRepository.save(existingUser);

            // 2-4. 임시 GUEST 계정의 약속 데이터 이전 (옵션: 필요시 구현)
            // appointmentRepository.updateUserId(userId, existingUser.getId());

            // 2-5. 임시 GUEST 계정 삭제
            appointmentRepository.deleteByUserId(userId);
            userRepository.delete(currentUser);

            log.info("=== 계정 통합 완료 - 통합된 계정 ID: {} ===", existingUser.getId());
            return existingUser;
        }

        // 3. 기존 계정이 없거나, 자기 자신인 경우 → 단순 온보딩 완료
        log.info("=== 신규 계정 온보딩 완료 - User ID: {} ===", userId);

        // 닉네임 중복 체크
        if (request.nickname() != null && !request.nickname().equals(currentUser.getNickname())) {
            if (!isNicknameAvailable(request.nickname())) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }
            currentUser.setNickname(request.nickname());
        }

        // 이메일 업데이트 (중복 체크)
        if (request.email() != null && !request.email().equals(currentUser.getEmail())) {
            if (userRepository.findByEmail(request.email()).isPresent()) {
                log.warn("이메일 중복으로 인한 업데이트 스킵: {}", request.email());
            } else {
                currentUser.setEmail(request.email());
            }
        }

        // 휴대폰 번호 업데이트
        if (request.phoneNumber() != null) {
            currentUser.setPhoneNumber(request.phoneNumber());
        }

        // 프로필 이미지 업로드
        if (profileImage != null && !profileImage.isEmpty()) {
            String imageUrl = saveProfileImage(profileImage);
            currentUser.setProfileImageUrl(imageUrl);
        }

        // 온보딩 완료 처리 (GUEST → USER 전환)
        currentUser.completeOnboarding();

        return userRepository.save(currentUser);
    }

    /**
     * 소셜 ID 통합 (from 계정의 소셜 ID를 to 계정에 병합)
     */
    private void mergeSocialIds(User from, User to) {
        log.info("=== 소셜 ID 병합 - From: {}, To: {} ===", from.getId(), to.getId());

        if (from.getKakaoId() != null) {
            log.info("Kakao ID 병합: {}", from.getKakaoId());
            to.setKakaoId(from.getKakaoId());
        }

        if (from.getGoogleId() != null) {
            log.info("Google ID 병합: {}", from.getGoogleId());
            to.setGoogleId(from.getGoogleId());
        }

        if (from.getNaverId() != null) {
            log.info("Naver ID 병합: {}", from.getNaverId());
            to.setNaverId(from.getNaverId());
        }
    }

    /**
     * 프로필 수정
     */
    @Transactional
    public User updateProfile(Long userId, OnboardingRequest request, MultipartFile profileImage) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 닉네임 중복 체크
        if (request.nickname() != null && !request.nickname().equals(user.getNickname())) {
            if (!isNicknameAvailable(request.nickname())) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(request.nickname());
        }

        // 이메일 업데이트 (중복 체크)
        if (request.email() != null && !request.email().equals(user.getEmail())) {
            if (userRepository.findByEmail(request.email()).isPresent()) {
                throw new RuntimeException("이미 사용 중인 이메일입니다.");
            }
            user.setEmail(request.email());
        }

        // 프로필 이미지 업로드
        if (profileImage != null && !profileImage.isEmpty()) {
            String imageUrl = saveProfileImage(profileImage);
            user.setProfileImageUrl(imageUrl);
        }

        return userRepository.save(user);
    }

    /**
     * 채팅 온보딩 사용자 선호도 업데이트 (nickname, MBTI, 혼밥 레벨, tags)
     */
    @Transactional
    public User updateUserPreferences(Long userId, String nickname, String mbti, Integer soloLevel, String tags) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("=== 사용자 선호도 업데이트 - User ID: {} ===", userId);

        // 닉네임 업데이트 (중복 체크)
        if (nickname != null && !nickname.equals(user.getNickname())) {
            if (!isNicknameAvailable(nickname)) {
                throw new RuntimeException("이미 사용 중인 닉네임입니다.");
            }
            user.setNickname(nickname);
            log.info("닉네임 업데이트: {}", nickname);
        }

        // MBTI 업데이트 (I 또는 E만 허용)
        if (mbti != null && (mbti.equals("I") || mbti.equals("E"))) {
            user.setMbti(mbti);
            log.info("MBTI 업데이트: {}", mbti);
        }

        // 혼밥 레벨 업데이트 (1~10)
        if (soloLevel != null && soloLevel >= 1 && soloLevel <= 10) {
            user.setSoloLevel(soloLevel);
            log.info("혼밥 레벨 업데이트: {}", soloLevel);
        }

        // 태그 업데이트
        if (tags != null) {
            user.setTags(tags);
            log.info("태그 업데이트: {}", tags);
        }

        User savedUser = userRepository.save(user);
        log.info("=== 사용자 선호도 업데이트 완료 ===");

        return savedUser;
    }

    /**
     * 회원탈퇴
     */
    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 연관된 약속 데이터 삭제 (Cascade)
        appointmentRepository.deleteByUserId(userId);

        // 유저 삭제
        userRepository.delete(user);
    }

    /**
     * 문의하기 이메일 발송
     */
    public void sendContactEmail(User user, String subject, String content, MultipartFile[] images) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo("ezra.made.me@gmail.com");
            helper.setSubject("[작은 일탈 문의] " + subject);

            String emailContent = String.format(
                "문의자: %s (%s)\n이메일: %s\n휴대폰: %s\n\n내용:\n%s",
                user.getNickname(),
                user.getId(),
                user.getEmail() != null ? user.getEmail() : "미제공",
                user.getPhoneNumber() != null ? user.getPhoneNumber() : "미제공",
                content
            );

            helper.setText(emailContent);

            // 이미지 첨부
            if (images != null) {
                for (MultipartFile image : images) {
                    if (!image.isEmpty()) {
                        helper.addAttachment(image.getOriginalFilename(), image);
                    }
                }
            }

            mailSender.send(message);
            log.info("문의 이메일 발송 완료 - User: {}, Subject: {}", user.getId(), subject);

        } catch (Exception e) {
            log.error("문의 이메일 발송 실패", e);
            throw new RuntimeException("이메일 발송에 실패했습니다.");
        }
    }

    /**
     * 프로필 이미지 저장
     */
    private String saveProfileImage(MultipartFile file) {
        try {
            // 파일명 생성 (UUID + 원본 확장자)
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = "profile_" + UUID.randomUUID() + extension;

            // 저장 경로 생성
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 파일 저장
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            // URL 반환
            return "/uploads/" + filename;

        } catch (IOException e) {
            log.error("프로필 이미지 저장 실패", e);
            throw new RuntimeException("이미지 저장에 실패했습니다.");
        }
    }
}
