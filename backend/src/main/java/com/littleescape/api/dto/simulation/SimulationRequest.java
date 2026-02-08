package com.littleescape.api.dto.simulation;

import com.littleescape.api.domain.type.AirQuality;
import com.littleescape.api.domain.type.Congestion;
import com.littleescape.api.domain.type.MissionCategory;
import com.littleescape.api.domain.type.Weather;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * God Mode Simulation 요청 DTO
 * 모든 환경 변수를 통제하여 추천 로직을 테스트
 */
@Schema(description = "시뮬레이션 요청 - 모든 환경 변수를 통제")
public record SimulationRequest(

    @Schema(description = "가상의 현재 시간 (요일/시간대 체크용)", example = "2025-01-20T14:30:00")
    LocalDateTime targetDateTime,

    @Schema(description = "사용자 위도", example = "37.5665")
    Double latitude,

    @Schema(description = "사용자 경도", example = "126.9780")
    Double longitude,

    @Schema(description = "탐색 반경 (km)", example = "10")
    Integer searchRadius,

    @Schema(description = "날씨 상태", example = "SUNNY")
    Weather weather,

    @Schema(description = "기온 (°C)", example = "15.5")
    Double temperature,

    @Schema(description = "공기 질 / 미세먼지", example = "GOOD")
    AirQuality airQuality,

    @Schema(description = "혼잡도", example = "LOW")
    Congestion congestion,

    @Schema(description = "사용자 MBTI (I or E)", example = "I")
    String userMbti,

    @Schema(description = "특정 카테고리 강제 지정 (선택 사항)", example = "FOOD", nullable = true)
    MissionCategory forcedCategory
) {

    /**
     * 기본값 검증 및 설정
     */
    public SimulationRequest {
        if (targetDateTime == null) {
            targetDateTime = LocalDateTime.now();
        }
        if (searchRadius == null || searchRadius <= 0) {
            searchRadius = 10;
        }
        if (weather == null) {
            weather = Weather.SUNNY;
        }
        if (temperature == null) {
            temperature = 20.0;
        }
        if (airQuality == null) {
            airQuality = AirQuality.GOOD;
        }
        if (congestion == null) {
            congestion = Congestion.LOW;
        }
    }
}
