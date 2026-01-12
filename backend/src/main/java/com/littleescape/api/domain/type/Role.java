package com.littleescape.api.domain.type;

public enum Role {
    GUEST,  // 임시 회원 (소셜 로그인만 완료, 온보딩 미완료)
    USER    // 정식 회원 (온보딩 완료)
}
