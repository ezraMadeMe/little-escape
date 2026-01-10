package com.littleescape.api.dto;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;

import java.time.LocalDateTime;

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
    String proofImageUrl,
    // 방문 횟수
    Long visitCount
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
            appointment.getProofImageUrl(),
            // 방문 횟수 (계산된 값)
            visitCount
        );
    }
}
