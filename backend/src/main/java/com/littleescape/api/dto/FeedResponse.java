package com.littleescape.api.dto;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class FeedResponse {
    private Long appointmentId;
    private String missionTitle;
    private String placeName;
    private List<String> proofImageUrls;
    private String proofComment;
    private String userNickname;
    private LocalDateTime completedAt;
    private List<String> reviewKeywords;
    private Double rating;  // 별점
    private AppointmentStatus status;  // ACCEPTED, ARRIVED, COMPLETED 등
    private LocalDateTime scheduledAt;
    private Boolean isLikedByMe;  // 현재 사용자가 좋아요 했는지 여부
    private Long likeCount;       // 좋아요 횟수
    private Boolean isSavedByMe;  // 현재 사용자가 저장했는지 여부
    private Long saveCount;       // 저장 횟수
    private Long commentCount;    // 댓글 횟수

    public static FeedResponse from(Appointment appointment) {
        return from(appointment, null, 0L, 0L, 0L);
    }

    public static FeedResponse from(Appointment appointment, Long currentUserId) {
        return from(appointment, currentUserId, 0L, 0L, 0L);
    }

    public static FeedResponse from(Appointment appointment, Long currentUserId, Long likeCount, Long saveCount, Long commentCount) {
        // 사용자 닉네임 (익명 처리 옵션)
        String userNickname = appointment.getUser() != null
            ? maskNickname(appointment.getUser().getNickname())
            : "익명";

        // 장소 이름
        String placeName = appointment.getPlace() != null
            ? appointment.getPlace().getName()
            : "자유 장소";

        // 미션 타이틀
        String missionTitle = appointment.getMissionTemplate() != null
            ? appointment.getMissionTemplate().getTitle()
            : "미션 정보 없음";

        return new FeedResponse(
            appointment.getId(),
            missionTitle,
            placeName,
            appointment.getProofImageUrls(),
            appointment.getProofComment(),
            userNickname,
            appointment.getCompletedAt(),
            appointment.getReviewKeywords(),
            appointment.getRating(), // 별점
            appointment.getStatus(),
            appointment.getScheduledAt(),
            false,  // isLikedByMe - will be set by service layer
            likeCount,
            false,  // isSavedByMe - will be set by service layer
            saveCount,
            commentCount
        );
    }

    /**
     * 닉네임 익명 처리 (첫 글자만 표시, 나머지는 *)
     * 예: "홍길동" -> "홍**"
     */
    private static String maskNickname(String nickname) {
        if (nickname == null || nickname.length() == 0) {
            return "익명";
        }
        if (nickname.length() == 1) {
            return nickname + "*";
        }
        return nickname.charAt(0) + "*".repeat(nickname.length() - 1);
    }
}
