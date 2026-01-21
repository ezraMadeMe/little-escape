package com.littleescape.api.dto.simulation;

import com.littleescape.api.dto.MissionTemplateResponse;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

/**
 * God Mode Simulation 응답 DTO
 * 추천된 미션/장소와 함께 디버그 로그 제공
 */
@Schema(description = "시뮬레이션 응답 - 추천 결과 및 디버그 로그")
public record SimulationResponse(

    @Schema(description = "추천된 미션 정보")
    MissionTemplateResponse mission,

    @Schema(description = "추천된 장소 정보 (장소가 필요한 미션인 경우)")
    PlaceInfo place,

    @Schema(description = "디버그 로그 - 필터링/추천 과정 설명")
    List<String> debugLogs,

    @Schema(description = "총 검색된 미션 후보 개수")
    Integer totalMissionCandidates,

    @Schema(description = "필터링 후 미션 후보 개수")
    Integer filteredMissionCandidates,

    @Schema(description = "총 검색된 장소 후보 개수")
    Integer totalPlaceCandidates,

    @Schema(description = "필터링 후 장소 후보 개수")
    Integer filteredPlaceCandidates,

    @Schema(description = "필터링 후 전체 미션 목록")
    List<MissionTemplateResponse> allFilteredMissions,

    @Schema(description = "필터링 후 전체 장소 목록")
    List<PlaceInfo> allFilteredPlaces
) {

    /**
     * 장소 정보 (간소화된 버전)
     */
    @Schema(description = "장소 정보")
    public record PlaceInfo(
        Long id,
        String name,
        String address,
        String category,
        Double latitude,
        Double longitude,
        String imageUrl,
        String tags
    ) {}
}
