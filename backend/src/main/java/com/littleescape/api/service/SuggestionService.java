package com.littleescape.api.service;

import com.littleescape.api.domain.Suggestion;
import com.littleescape.api.domain.User;
import com.littleescape.api.repository.SuggestionRepository;
import com.littleescape.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SuggestionService {

    private final SuggestionRepository suggestionRepository;
    private final UserRepository userRepository;

    @Transactional
    public Suggestion createSuggestion(Long userId, String content) {
        log.info("=== 사용자 제보 생성 시작 ===");
        log.info("User ID: {}, Content 길이: {}", userId, content.length());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        Suggestion suggestion = new Suggestion(user, content);
        Suggestion saved = suggestionRepository.save(suggestion);

        log.info("=== 사용자 제보 저장 완료 (ID: {}) ===", saved.getId());
        return saved;
    }
}
