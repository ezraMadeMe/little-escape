package com.littleescape.api.dto.simulation;

import com.littleescape.api.domain.Place;
import com.littleescape.api.domain.PlaceDetailFacility;
import com.littleescape.api.domain.PlaceDetailPerformance;
import com.littleescape.api.dto.MissionTemplateResponse;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
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

    @Schema(description = "Structured stage-by-stage simulation trace")
    List<StageInfo> stages,

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

    @Schema(description = "Stage-level structured debug info")
    public record StageInfo(
        String code,
        String label,
        String targetType,
        Integer beforeCount,
        Integer afterCount,
        List<ReasonInfo> reasons,
        List<SelectionInfo> selections
    ) {
    }

    @Schema(description = "Structured exclusion or transition reason")
    public record ReasonInfo(
        String code,
        Integer beforeCount,
        Integer afterCount,
        String detail
    ) {
    }

    @Schema(description = "Final selected entity info")
    public record SelectionInfo(
        String type,
        Long id,
        String name,
        String category,
        String detail
    ) {
    }

    /**
     * 공연/축제 상세 정보
     */
    @Schema(description = "공연/축제 상세 정보")
    public record PerformanceDetailInfo(
        LocalDate startDate,
        LocalDate endDate,
        Integer ticketPrice,
        String performanceState
    ) {
        public static PerformanceDetailInfo from(PlaceDetailPerformance detail) {
            if (detail == null) return null;
            return new PerformanceDetailInfo(
                detail.getStartDate(),
                detail.getEndDate(),
                detail.getTicketPrice(),
                detail.getPerformanceState()
            );
        }
    }

    /**
     * 시설 상세 정보
     */
    @Schema(description = "시설(도서관/공원 등) 상세 정보")
    public record FacilityDetailInfo(
        String operatingTime,
        String closedDays,
        String tel,
        String homepage
    ) {
        public static FacilityDetailInfo from(PlaceDetailFacility detail) {
            if (detail == null) return null;
            return new FacilityDetailInfo(
                detail.getOperatingTime(),
                detail.getClosedDays(),
                detail.getTel(),
                detail.getHomepage()
            );
        }
    }

    /**
     * 장소 정보 (허브 + 디테일 통합)
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
        String tags,
        String url,
        String dataSource,
        Boolean isFree,
        @Schema(description = "공연/축제 상세 (해당되는 경우)")
        PerformanceDetailInfo performanceDetail,
        @Schema(description = "시설 상세 (해당되는 경우)")
        FacilityDetailInfo facilityDetail
    ) {
        public static PlaceInfo from(Place place) {
            return new PlaceInfo(
                place.getId(),
                place.getName(),
                place.getAddress(),
                place.getCategory().name(),
                place.getLatitude(),
                place.getLongitude(),
                place.getImageUrl(),
                place.getTags(),
                place.getUrl(),
                place.getDataSource() != null ? place.getDataSource().name() : null,
                place.getIsFree(),
                PerformanceDetailInfo.from(place.getPerformanceDetail()),
                FacilityDetailInfo.from(place.getFacilityDetail())
            );
        }
    }
}
