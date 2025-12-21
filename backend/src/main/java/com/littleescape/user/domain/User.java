package com.littleescape.user.domain;

import com.littleescape.common.domain.BaseTimeEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String kakaoId;

    @Column(nullable = false)
    private String nickname;

    protected User() {}

    public User(String kakaoId, String nickname) {
        this.kakaoId = kakaoId;
        this.nickname = nickname;
    }

    public Long getId() { return id; }
    public String getKakaoId() { return kakaoId; }
    public String getNickname() { return nickname; }

    public void changeNickname(String nickname) {
        this.nickname = nickname;
    }
}