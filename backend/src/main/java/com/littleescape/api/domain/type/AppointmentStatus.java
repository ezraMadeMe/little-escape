package com.littleescape.api.domain.type;

public enum AppointmentStatus {
    PENDING,    // 대기 중
    ACCEPTED,   // 수락됨
    REJECTED,   // 거절됨
    CANCELLED,  // 취소됨
    COMPLETED,  // 완료됨
    NO_SHOW     // 불참
}
