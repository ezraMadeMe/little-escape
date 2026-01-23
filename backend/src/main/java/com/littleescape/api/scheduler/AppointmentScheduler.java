package com.littleescape.api.scheduler;

import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * 약속 자동 만료 처리 스케줄러
 *
 * 기능:
 * - 예정 시간(scheduledAt)으로부터 24시간이 경과했는데도 도착 인증을 하지 않은 약속을 자동으로 EXPIRED 상태로 변경
 *
 * 실행 주기:
 * - 매 시간 정각(00분)에 실행
 * - 테스트용: "0 * * * * *" (1분마다)
 * - 운영용: "0 0 * * * *" (매 시간 정각)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentScheduler {

    private final AppointmentRepository appointmentRepository;

    /**
     * 만료된 약속 자동 처리
     *
     * 조건:
     * - 상태가 PENDING, ACCEPTED, UNLOCKED 중 하나
     * - scheduledAt이 현재 시간으로부터 24시간 이전
     *
     * 동작:
     * - 해당 약속들을 EXPIRED 상태로 일괄 변경
     */
    // @Transactional
    // @Scheduled(cron = "0 0 * * * *") // 매 시간 정각에 실행
    public void checkExpiredAppointments() {
        try {
            // 1. 한국 시간 기준 현재 시간
            LocalDateTime nowKst = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

            // 2. 만료 기준 시간: 현재 시간 - 24시간
            LocalDateTime expirationTime = nowKst.minusHours(24);

            log.info("🕐 약속 만료 체크 시작");
            log.info("   - 현재 시간(KST): {}", nowKst);
            log.info("   - 만료 기준 시간: {} 이전", expirationTime);

            // 3. 만료 대상 상태 정의
            // PENDING: 대기 중
            // ACCEPTED: 수락됨 (구 상태)
            // UNLOCKED: 미션 공개됨
            List<AppointmentStatus> targetStatuses = List.of(
                AppointmentStatus.PENDING,
                AppointmentStatus.ACCEPTED,
                AppointmentStatus.UNLOCKED
            );

            log.info("   - 대상 상태: {}", targetStatuses);

            // 4. 배치 업데이트 실행 (JPA @Modifying 쿼리 사용)
            int expiredCount = appointmentRepository.updateExpiredAppointments(
                AppointmentStatus.EXPIRED,
                targetStatuses,
                expirationTime
            );

            if (expiredCount > 0) {
                log.info("✅ 약속 만료 처리 완료: {}건의 약속이 EXPIRED 상태로 변경됨", expiredCount);
            } else {
                log.info("📭 만료 대상 약속 없음 (조건에 맞는 약속이 없거나 이미 처리됨)");
            }

        } catch (Exception e) {
            log.error("❌ 약속 만료 체크 중 오류 발생: {}", e.getMessage(), e);
            e.printStackTrace();
        }
    }

    /**
     * 개발용: 테스트를 위한 1분마다 실행되는 메서드
     *
     * 운영 환경에서는 주석 처리하거나 삭제 필요
     *
     * 사용법:
     * 1. 이 메서드의 주석을 해제
     * 2. checkExpiredAppointments() 메서드의 @Scheduled 주석 처리
     * 3. 애플리케이션 재시작
     */
    @Transactional
    @Scheduled(cron = "0 * * * * *") // 1분마다 실행 (테스트용)
    public void checkExpiredAppointmentsTest() {
        log.info("🧪 [TEST] 약속 만료 체크 (1분 주기) 시작");
        checkExpiredAppointments();
    }
}
