package com.littleescape.api.controller;

import com.littleescape.api.dto.response.DailyMissionResponse;
import com.littleescape.api.service.MissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * 일일 미션 추천 및 Plan B 관련 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/missions")
@RequiredArgsConstructor
@Tag(name = "Mission", description = "일일 미션 추천 API")
public class MissionController {

    private final MissionService missionService;

    /**
     * 오늘의 미션 추천
     *
     * @param userId 사용자 ID (선택적, 향후 개인화 추천에 사용)
     * @param scheduledAt 약속 예정 시간 (선택적, 기본값: 현재 시간)
     * @return 추천된 일일 미션
     */
    @GetMapping("/today")
    @Operation(
        summary = "오늘의 미션 추천",
        description = "사용자에게 적합한 일일 미션을 랜덤으로 추천합니다. " +
                      "향후 시간대, 날씨, 사용자 선호도를 반영하여 개인화된 추천을 제공할 예정입니다."
    )
    public ResponseEntity<DailyMissionResponse> getDailyMission(
            @Parameter(description = "사용자 ID (향후 개인화 추천 사용)")
            @RequestParam(required = false) Long userId,

            @Parameter(description = "약속 예정 시간 (ISO-8601 형식: yyyy-MM-dd'T'HH:mm:ss)")
            @RequestParam(required = false)
            @DateTimeFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
            LocalDateTime scheduledAt
    ) {
        log.info("=== GET /api/v1/missions/today === userId: {}, scheduledAt: {}", userId, scheduledAt);

        DailyMissionResponse mission = missionService.getDailyMission(userId, scheduledAt);

        return ResponseEntity.ok(mission);
    }

    /**
     * Plan B (대안 미션) 요청
     *
     * @param missionId 원래 미션 ID
     * @return Plan B 미션 정보
     */
    @PostMapping("/{missionId}/escape")
    @Operation(
        summary = "Plan B (대안 미션) 요청",
        description = "원래 미션이 부담스러울 때 더 편안한 대안 미션을 제공합니다. " +
                      "주로 실내/휴식 카테고리의 미션이 추천됩니다."
    )
    public ResponseEntity<DailyMissionResponse> getEscapeMission(
            @Parameter(description = "원래 미션 ID")
            @PathVariable Long missionId
    ) {
        log.info("=== POST /api/v1/missions/{}/escape ===", missionId);

        DailyMissionResponse planBMission = missionService.getEscapeMission(missionId);

        return ResponseEntity.ok(planBMission);
    }
}
