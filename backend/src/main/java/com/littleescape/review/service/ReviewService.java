package com.littleescape.review.service;

import com.littleescape.review.domain.Review;
import com.littleescape.review.dto.ReviewDtos;
import com.littleescape.review.repo.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @Transactional
    public ReviewDtos.ReviewResponse create(Long userId, ReviewDtos.CreateReviewRequest req) {
        String tagsJson = (req.tags() == null) ? "[]" : req.tags().toString();          // TODO: JSON serialize
        String photosJson = (req.photoKeys() == null) ? "[]" : req.photoKeys().toString();

        Review review = new Review(req.sessionId(), userId, req.rating(), tagsJson, req.comment(), photosJson);
        reviewRepository.save(review);

        // TODO: shareToFeed면 FeedPost 생성 + 개인화 업데이트

        return new ReviewDtos.ReviewResponse(review.getId(), review.getSessionId(), review.getRating());
    }
}