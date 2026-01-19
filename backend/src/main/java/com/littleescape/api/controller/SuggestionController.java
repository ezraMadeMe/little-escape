package com.littleescape.api.controller;

import com.littleescape.api.domain.Suggestion;
import com.littleescape.api.service.SuggestionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/suggestions")
@RequiredArgsConstructor
public class SuggestionController {

    private final SuggestionService suggestionService;

    /**
     * 사용자 제보 생성 API
     * "사장님한테 훈수 두기" - 코스 추천/버그 제보
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSuggestion(
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, String> request) {

        log.info("=== 사용자 제보 API 호출 ===");

        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "로그인이 필요합니다."));
        }

        String content = request.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "내용을 입력해주세요."));
        }

        Suggestion suggestion = suggestionService.createSuggestion(Long.parseLong(userId), content);

        log.info("✅ 제보 저장 완료 (ID: {})", suggestion.getId());

        return ResponseEntity.ok(Map.of(
                "message", "제보가 접수되었습니다. 감사합니다! 🙏",
                "id", suggestion.getId()
        ));
    }
}
