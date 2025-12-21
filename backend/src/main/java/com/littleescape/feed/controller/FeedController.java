package com.littleescape.feed.controller;

import com.littleescape.common.api.ApiResponse;
import com.littleescape.feed.dto.FeedDtos;
import com.littleescape.feed.service.FeedService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/feed")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping
    public ApiResponse<Page<FeedDtos.FeedItem>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.ok(feedService.list(PageRequest.of(page, size)));
    }

    @GetMapping("/{postId}")
    public ApiResponse<FeedDtos.FeedDetail> detail(@PathVariable Long postId) {
        return ApiResponse.ok(feedService.detail(postId));
    }
}