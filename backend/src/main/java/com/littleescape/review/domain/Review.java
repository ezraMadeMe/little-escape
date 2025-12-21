package com.littleescape.review.domain;

import com.littleescape.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "reviews")
public class Review extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sessionId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private int rating;

    @Column(nullable = false, length = 2000)
    private String tagsJson;

    @Column(length = 2000)
    private String comment;

    @Column(nullable = false, length = 4000)
    private String photoKeysJson;

    protected Review() {}

    public Review(Long sessionId, Long userId, int rating, String tagsJson, String comment, String photoKeysJson) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.rating = rating;
        this.tagsJson = tagsJson;
        this.comment = comment;
        this.photoKeysJson = photoKeysJson;
    }

    public Long getId() { return id; }
    public Long getSessionId() { return sessionId; }
    public Long getUserId() { return userId; }
    public int getRating() { return rating; }
}