package com.littleescape.feed.service;

import com.littleescape.common.error.BizException;
import com.littleescape.feed.domain.FeedPost;
import com.littleescape.feed.dto.FeedDtos;
import com.littleescape.feed.repo.FeedPostRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class FeedService {

    private final FeedPostRepository feedPostRepository;

    public FeedService(FeedPostRepository feedPostRepository) {
        this.feedPostRepository = feedPostRepository;
    }

    public Page<FeedDtos.FeedItem> list(Pageable pageable) {
        return feedPostRepository.findByVisibilityOrderByCreatedAtDesc("PUBLIC", pageable)
                .map(p -> new FeedDtos.FeedItem(
                        p.getId(),
                        p.getTitle(),
                        p.getSummary(),
                        p.getLikeCount(),
                        p.getBookmarkCount(),
                        p.getCreatedAt()
                ));
    }

    public FeedDtos.FeedDetail detail(Long postId) {
        FeedPost p = feedPostRepository.findById(postId)
                .orElseThrow(() -> BizException.notFound("Post not found"));
        return new FeedDtos.FeedDetail(
                p.getId(),
                p.getTitle(),
                p.getSummary(),
                p.getVisibility(),
                p.getLikeCount(),
                p.getBookmarkCount(),
                p.getCreatedAt()
        );
    }
}