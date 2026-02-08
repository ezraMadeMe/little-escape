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
    Double rating,                // 별점
    // 방문 횟수
    Long visitCount,
    // 즐겨찾기 여부
    boolean isFavorite,
    // 미션 가이드 (JSON)
    String missionGuide,
    String missionDescription, // 미션 상세 설명
    // 미션 공개 여부 (D-1에 공개)
    boolean isMissionRevealed
) {
    public static AppointmentResponse from(Appointment appointment, Long visitCount) {
        // 장소가 매칭되었는지 확인
        boolean hasPlace = appointment.getPlace() != null;
        boolean hasMission = appointment.getMissionTemplate() != null;
        boolean isMissionRevealed = appointment.isMissionRevealed();

        // 미션 공개 여부에 따른 조건부 정보 제공
        // - 미션 미공개(D-1 전): 장소 정보만 표시, 미션 관련 정보는 숨김
        // - 미션 공개(D-1 후): 모든 정보 표시
        String missionTitle = null;
        String missionImageUrl = null;
        String missionGuide = null;
        String missionDescription = null;

        if (isMissionRevealed && hasMission) {
            // 미션 공개된 경우: 미션 정보 표시
            missionTitle = appointment.getMissionTemplate().getTitle();
            missionImageUrl = appointment.getMissionTemplate().getImageUrl();
            missionGuide = appointment.getMissionTemplate().getGuide();
            missionDescription = appointment.getMissionTemplate().getDescription();
        } else if (!isMissionRevealed && hasPlace) {
            // 미션 미공개 + 장소가 있는 경우: 장소 이름을 제목으로 대체
            missionTitle = "🔒 " + appointment.getPlace().getName() + "에서 만나요!";
            missionDescription = "미션은 하루 전에 공개됩니다";
        }

        return new AppointmentResponse(
            appointment.getId(),
            missionTitle,
            appointment.getStatus(),
            appointment.getScheduledAt(),
            appointment.getCreatedAt(),
            // 장소 정보 매핑 (항상 공개)
            hasPlace ? appointment.getPlace().getName() : null,
            hasPlace ? appointment.getPlace().getAddress() : null,
            hasPlace ? appointment.getPlace().getUrl() : null,
            hasPlace ? appointment.getPlace().getLatitude() : null,
            hasPlace ? appointment.getPlace().getLongitude() : null,
            // 이미지 URL 매핑 (미션 미공개 시 장소 이미지로 대체)
            isMissionRevealed && hasMission ? appointment.getMissionTemplate().getImageUrl() : null,
            hasPlace ? appointment.getPlace().getImageUrl() : null,
            // 완료 인증 정보
            appointment.getProofComment(),
            appointment.getProofImageUrl(),  // 하위 호환성
            appointment.getProofImageUrls() != null ? appointment.getProofImageUrls() : List.of(),  // 다중 이미지
            appointment.getReviewKeywords() != null ? appointment.getReviewKeywords() : List.of(),  // 키워드
            appointment.getRating(), // 별점
            // 방문 횟수 (계산된 값)
            visitCount,
            // 즐겨찾기 여부
            appointment.isFavorite(),
            // 미션 가이드 (미공개 시 숨김)
            missionGuide,
            missionDescription,
            // 미션 공개 여부
            isMissionRevealed
        );
    }
}
