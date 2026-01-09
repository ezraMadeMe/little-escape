package com.littleescape.api.domain;

import com.littleescape.api.domain.type.MissionCategory;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "mission_templates")
@Getter
@Setter
@NoArgsConstructor
public class MissionTemplate extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MissionCategory category;

    @Column(name = "difficulty_level", nullable = false)
    private String difficultyLevel;

    @Column(columnDefinition = "TEXT")
    private String condition;

    @Column(name = "image_url", length = 500)
    private String imageUrl;
}
