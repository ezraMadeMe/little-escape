package com.littleescape.feed.dto;

import java.time.LocalDateTime;

public class FeedDtos {

    public record FeedItem(
            Long postId,
            String title,
            String summary,
            int likeCount,
            int bookmarkCount,
            LocalDateTime createdAt
    ) {}

    public record FeedDetail(
            Long postId,
            String title,
            String summary,
            String visibility,
            int likeCount,
            int bookmarkCount,
            LocalDateTime createdAt
    ) {}
}