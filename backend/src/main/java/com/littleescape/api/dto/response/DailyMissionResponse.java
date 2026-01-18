package com.littleescape.api.dto.response;

import com.littleescape.api.domain.type.MissionCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 프론트엔드 Mission 타입에 매칭되는 일일 미션 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyMissionResponse {

    private Long id;

    private String title;

    private String description;

    // 장소 정보
    private LocationInfo location;

    // 만날 시간 (예: "오후 3:00")
    private String timeToMeet;

    // 미션 완료 여부
    private Boolean isCompleted;

    // 카테고리 (추가 정보)
    private MissionCategory category;

    // 이미지 URL
    private String imageUrl;

    // Plan B 정보 (탈출 옵션)
    private PlanB planB;

    /**
     * 장소 정보 내부 DTO
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationInfo {
        private String name;        // 장소명 (예: "성수역 3번 출구")
        private String address;     // 주소
        private Double latitude;    // 위도
        private Double longitude;   // 경도
    }

    /**
     * Plan B (대안 미션) 정보
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlanB {
        private String title;       // Plan B 제목
        private String description; // Plan B 설명
        private String placeName;   // 대안 장소명
        private String reason;      // 츤데레 톤의 추천 이유
    }
}
