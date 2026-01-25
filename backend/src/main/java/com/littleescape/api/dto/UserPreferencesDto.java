package com.littleescape.api.dto;

/**
 * 채팅 온보딩에서 수집한 사용자 선호도 정보
 */
public record UserPreferencesDto(
        String nickname,
        String mbti,      // I 또는 E
        Integer soloLevel // 1~10 (혼밥 레벨)
) {
}






