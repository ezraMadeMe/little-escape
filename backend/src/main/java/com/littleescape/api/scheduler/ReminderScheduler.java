package com.littleescape.api.scheduler;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    // 매 시간 정각마다 실행 (초, 분, 시, 일, 월, 요일) -> 0분 0초에 실행
    // 테스트 할 때는 1분마다 돌게: cron = "0 * * * * *" 로 변경 가능
    @Transactional(readOnly = true)
    @Scheduled(cron = "0 0 0 * * *") 
    public void sendReminders() {
        // 1. 한국 시간 기준으로 현재 시간 가져오기
        LocalDateTime nowKst = LocalDateTime.now(ZoneId.of("Asia/Seoul"));

        // 2. '분/초'를 버리고 정각(00분 00초)으로 맞춤
        // 예: 14:38:22 -> 14:00:00
        LocalDateTime currentHour = nowKst.truncatedTo(ChronoUnit.HOURS);

        // 3. 타겟 범위 설정: 내일 같은 시간대의 1시간 전체
        // 예: 내일 14:00:00 ~ 14:59:59
        LocalDateTime start = currentHour.plusDays(1);
        LocalDateTime end = start.plusHours(1).minusSeconds(1);

        log.info("📧 리마인더 스케줄러 실행: 검색 범위 [{} ~ {}]", start, end);

        // 4. 해당 범위의 약속 조회
        List<Appointment> appointments = appointmentRepository.findAllByScheduledAtBetween(start, end);

        if (appointments.isEmpty()) {
            log.info("📭 발송할 리마인더가 없습니다.");
            return;
        }

        for (Appointment appointment : appointments) {
            // 상태 체크 (취소된 건 보내면 안됨)
            if (appointment.getStatus() == AppointmentStatus.CANCELLED || 
                appointment.getStatus() == AppointmentStatus.COMPLETED) {
                continue;
            }

            // 이메일이 없는 경우 스킵 (소셜 로그인 정보 확인 필요)
            if (appointment.getUser().getEmail() == null) {
                log.warn("⚠️ 유저(ID:{})의 이메일이 없어 발송 실패", appointment.getUser().getId());
                continue;
            }

            try {
                // 미션 제목이 없으면 기본 문구 사용
                String missionTitle = appointment.getMissionTemplate() != null 
                    ? appointment.getMissionTemplate().getTitle() 
                    : "비밀의 일탈";

                emailService.sendReminderEmail(
                        appointment.getUser().getEmail(),
                        appointment.getUser().getNickname(),
                        missionTitle,
                        appointment.getScheduledAt()
                );
                log.info("✅ 리마인더 발송 성공: {} ({})", appointment.getUser().getNickname(), appointment.getUser().getEmail());
            } catch (Exception e) {
                log.error("❌ 리마인더 발송 중 에러 발생: {}", e.getMessage());
            }
        }
    }
}