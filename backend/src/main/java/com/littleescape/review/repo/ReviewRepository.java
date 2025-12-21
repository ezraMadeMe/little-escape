package com.littleescape.review.repo;

import com.littleescape.review.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    Optional<Review> findBySessionId(Long sessionId);
}