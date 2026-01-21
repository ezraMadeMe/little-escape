package com.littleescape.api.dto;

import com.littleescape.api.domain.Appointment;
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

    public static FeedResponse from(Appointment appointment) {
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
            appointment.getReviewKeywords()
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
