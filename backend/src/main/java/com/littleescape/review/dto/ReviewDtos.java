package com.littleescape.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class ReviewDtos {

    public record CreateReviewRequest(
            @NotNull Long sessionId,
            @Min(1) @Max(5) int rating,
            List<String> tags,
            String comment,
            List<String> photoKeys,
            boolean shareToFeed
    ) {}

    public record ReviewResponse(
            Long reviewId,
            Long sessionId,
            int rating
    ) {}
}