package com.littleescape.api.domain.type;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * 서울시 실시간 혼잡도 레벨
 *
 * API 응답값 (AREA_CONGEST_LVL):
 * - 여유: 1
 * - 보통: 2
 * - 약간 붐빔: 3
 * - 붐빔: 4
 * - 매우 붐빔: 5
 */
public enum CongestionLevel {
    SMOOTH("여유"),           // 레벨 1
    NORMAL("보통"),           // 레벨 2
    SLIGHTLY_CROWDED("약간 붐빔"),  // 레벨 3
    CROWDED("붐빔"),          // 레벨 4
    VERY_CROWDED("매우 붐빔"); // 레벨 5

    private final String description;

    CongestionLevel(String description) {
        this.description = description;
    }

    @JsonValue
    public String getDescription() {
        return description;
    }

    /**
     * API 응답 레벨 숫자를 Enum으로 변환
     *
     * @param level 1~5 사이의 혼잡도 레벨
     * @return CongestionLevel enum
     * @throws IllegalArgumentException 유효하지 않은 레벨일 경우
     */
    public static CongestionLevel fromLevel(int level) {
        return switch (level) {
            case 1 -> SMOOTH;
            case 2 -> NORMAL;
            case 3 -> SLIGHTLY_CROWDED;
            case 4 -> CROWDED;
            case 5 -> VERY_CROWDED;
            default -> throw new IllegalArgumentException("Invalid congestion level: " + level);
        };
    }

    /**
     * 혼잡도 레벨이 허용 가능한 범위인지 확인
     *
     * @param maxLevel 최대 허용 레벨
     * @return 허용 가능하면 true
     */
    public boolean isAcceptable(CongestionLevel maxLevel) {
        return this.ordinal() <= maxLevel.ordinal();
    }
}
