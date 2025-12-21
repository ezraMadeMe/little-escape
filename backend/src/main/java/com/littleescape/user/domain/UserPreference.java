package com.littleescape.user.domain;

import com.littleescape.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "user_preferences")
public class UserPreference extends BaseTimeEntity {

    @Id
    private Long userId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 2000)
    private String preferredTagsJson;

    @Column(nullable = false, length = 2000)
    private String avoidTagsJson;

    @Column(nullable = false)
    private String defaultMode; // "CAR" or "TRANSIT"

    @Column(nullable = false)
    private double explorationRate; // 0~1

    protected UserPreference() {}

    public UserPreference(User user) {
        this.user = user;
        this.preferredTagsJson = "[]";
        this.avoidTagsJson = "[]";
        this.defaultMode = "CAR";
        this.explorationRate = 0.15;
    }

    public Long getUserId() { return userId; }
    public User getUser() { return user; }
    public String getPreferredTagsJson() { return preferredTagsJson; }
    public String getAvoidTagsJson() { return avoidTagsJson; }
    public String getDefaultMode() { return defaultMode; }
    public double getExplorationRate() { return explorationRate; }

    public void update(String preferredTagsJson, String avoidTagsJson, String defaultMode, double explorationRate) {
        this.preferredTagsJson = preferredTagsJson;
        this.avoidTagsJson = avoidTagsJson;
        this.defaultMode = defaultMode;
        this.explorationRate = explorationRate;
    }
}