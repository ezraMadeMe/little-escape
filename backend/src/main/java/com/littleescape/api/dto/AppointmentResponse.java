package com.littleescape.api.dto;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;

import java.time.LocalDateTime;
import java.util.List;

public record AppointmentResponse(
    Long id,
    String missionTitle,
    AppointmentStatus status,
    LocalDateTime scheduledAt,
    LocalDateTime createdAt,
    // 장소 정보 필드
    String placeName,
    String placeAddress,
    String placeUrl,
    Double latitude,
    Double longitude,
    // 이미지 URL 필드
    String missionImageUrl,
    String placeImageUrl,
    // 완료 인증 필드
    String proofComment,
    @Deprecated
    String proofImageUrl,  // 하위 호환성을 위해 유지
    List<String> proofImageUrls,  // 다중 이미지 URL
    List<String> reviewKeywords,  // 감성 키워드
    // 방문 횟수
    Long visitCount,
    // 즐겨찾기 여부
    boolean isFavorite,
    // 미션 가이드 (JSON)
    String missionGuide
) {
    public static AppointmentResponse from(Appointment appointment, Long visitCount) {
        // 장소가 매칭되었는지 확인
        boolean hasPlace = appointment.getPlace() != null;
        boolean hasMission = appointment.getMissionTemplate() != null;

        return new AppointmentResponse(
            appointment.getId(),
            hasMission ? appointment.getMissionTemplate().getTitle() : null,
            appointment.getStatus(),
            appointment.getScheduledAt(),
            appointment.getCreatedAt(),
            // 장소 정보 매핑 (없으면 null)
            hasPlace ? appointment.getPlace().getName() : null,
            hasPlace ? appointment.getPlace().getAddress() : null,
            hasPlace ? appointment.getPlace().getUrl() : null,
            hasPlace ? appointment.getPlace().getLatitude() : null,
            hasPlace ? appointment.getPlace().getLongitude() : null,
            // 이미지 URL 매핑
            hasMission ? appointment.getMissionTemplate().getImageUrl() : null,
            hasPlace ? appointment.getPlace().getImageUrl() : null,
            // 완료 인증 정보
            appointment.getProofComment(),
            appointment.getProofImageUrl(),  // 하위 호환성
            appointment.getProofImageUrls() != null ? appointment.getProofImageUrls() : List.of(),  // 다중 이미지
            appointment.getReviewKeywords() != null ? appointment.getReviewKeywords() : List.of(),  // 키워드
            // 방문 횟수 (계산된 값)
            visitCount,
            // 즐겨찾기 여부
            appointment.isFavorite(),
            // 미션 가이드
            hasMission ? appointment.getMissionTemplate().getGuide() : null
        );
    }
}
