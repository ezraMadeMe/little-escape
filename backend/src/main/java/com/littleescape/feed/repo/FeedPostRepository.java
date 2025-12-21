package com.littleescape.feed.repo;

import com.littleescape.feed.domain.FeedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedPostRepository extends JpaRepository<FeedPost, Long> {
    Page<FeedPost> findByVisibilityOrderByCreatedAtDesc(String visibility, Pageable pageable);
}