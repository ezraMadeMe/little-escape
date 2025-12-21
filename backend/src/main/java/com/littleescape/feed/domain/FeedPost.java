package com.littleescape.feed.domain;

import com.littleescape.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "feed_posts")
public class FeedPost extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long sessionId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String summary;

    @Column(nullable = false)
    private String visibility; // PUBLIC/PRIVATE

    @Column(nullable = false)
    private int likeCount;

    @Column(nullable = false)
    private int bookmarkCount;

    protected FeedPost() {}

    public FeedPost(Long userId, Long sessionId, String title, String summary, String visibility) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.title = title;
        this.summary = summary;
        this.visibility = visibility;
        this.likeCount = 0;
        this.bookmarkCount = 0;
    }

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public Long getSessionId() { return sessionId; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public String getVisibility() { return visibility; }
    public int getLikeCount() { return likeCount; }
    public int getBookmarkCount() { return bookmarkCount; }

    public void incLike() { this.likeCount++; }
    public void decLike() { this.likeCount = Math.max(0, this.likeCount - 1); }
    public void incBookmark() { this.bookmarkCount++; }
    public void decBookmark() { this.bookmarkCount = Math.max(0, this.bookmarkCount - 1); }
}