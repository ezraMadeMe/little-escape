package com.littleescape.review.controller;

import com.littleescape.common.api.ApiResponse;
import com.littleescape.review.dto.ReviewDtos;
import com.littleescape.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ApiResponse<ReviewDtos.ReviewResponse> create(
            @RequestHeader("X-USER-ID") Long userId,
            @Valid @RequestBody ReviewDtos.CreateReviewRequest req
    ) {
        return ApiResponse.ok(reviewService.create(userId, req));
    }
}