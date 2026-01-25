package com.littleescape.api.dto;

import com.littleescape.api.domain.Comment;
import java.time.LocalDateTime;

public record CommentResponse(
    Long id,
    String content,
    String userNickname,
    String userProfileImage,
    boolean isMyComment,
    LocalDateTime createdAt
) {
    public static CommentResponse from(Comment comment, Long currentUserId) {
        boolean isMyComment = comment.getUser().getId().equals(currentUserId);
        
        // 닉네임 익명 처리 (FeedResponse와 동일 로직)
        String nickname = comment.getUser().getNickname();
        if (nickname == null || nickname.length() == 0) {
            nickname = "익명";
        } else if (nickname.length() == 1) {
            nickname = nickname + "*";
        } else {
            nickname = nickname.charAt(0) + "*".repeat(nickname.length() - 1);
        }

        return new CommentResponse(
            comment.getId(),
            comment.getContent(),
            nickname,
            comment.getUser().getProfileImageUrl(),
            isMyComment,
            comment.getCreatedAt()
        );
    }
}
