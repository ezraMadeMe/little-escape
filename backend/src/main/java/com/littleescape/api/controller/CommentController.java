package com.littleescape.api.controller;

import com.littleescape.api.dto.CommentResponse;
import com.littleescape.api.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "댓글 API")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @Operation(summary = "댓글 작성")
    public ResponseEntity<CommentResponse> createComment(
            @AuthenticationPrincipal String userId,
            @RequestBody Map<String, Object> request) {
        Long appointmentId = Long.valueOf(request.get("appointmentId").toString());
        String content = (String) request.get("content");
        
        return ResponseEntity.ok(commentService.createComment(Long.parseLong(userId), appointmentId, content));
    }

    @GetMapping("/appointment/{appointmentId}")
    @Operation(summary = "약속의 댓글 목록 조회")
    public ResponseEntity<List<CommentResponse>> getComments(
            @AuthenticationPrincipal String userId,
            @PathVariable Long appointmentId) {
        Long userIdLong = userId != null ? Long.parseLong(userId) : null;
        return ResponseEntity.ok(commentService.getComments(userIdLong, appointmentId));
    }

    @DeleteMapping("/{commentId}")
    @Operation(summary = "댓글 삭제")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal String userId,
            @PathVariable Long commentId) {
        commentService.deleteComment(Long.parseLong(userId), commentId);
        return ResponseEntity.ok().build();
    }
}
