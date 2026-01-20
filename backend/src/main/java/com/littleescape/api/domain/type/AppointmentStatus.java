package com.littleescape.api.domain.type;

public enum AppointmentStatus {
    CREATED,    // 시간/장소만 정하고, 미션은 아직 모르는 상태 (채팅방 생성 직후)
    UNLOCKED,   // 약속 D-1일, 사용자가 미션을 선택할 수 있게 된 상태
    PENDING,    // 대기 중 (기존 호환성 유지)
    ACCEPTED,   // 수락됨
    REJECTED,   // 거절됨
    CANCELLED,  // 취소됨
    COMPLETED,  // 완료됨
    NO_SHOW,    // 불참
    ARRIVED,    // 도착
    PLAN_B_ACTIVATED  // 악천후로 인한 Plan B 자동 전환
}
