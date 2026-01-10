package com.littleescape.api.scheduler;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.User;
import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReportScheduler {

    private final AppointmentRepository appointmentRepository;
    private final EmailService emailService;

    /**
     * 월간 리포트 발송 스케줄러
     * 매월 1일 오전 9시에 실행되어 지난달의 완료된 약속을 집계하여 이메일로 발송
     */
    @Transactional(readOnly = true)
    @Scheduled(cron = "0 0 9 1 * *")
    public void sendMonthlyReport() {
        log.info("📊 월간 리포트 스케줄러 실행 시작");

        // 1. 어제 날짜를 기준으로 지난달 구하기
        LocalDate yesterday = LocalDate.now(ZoneId.of("Asia/Seoul")).minusDays(1);
        int lastMonth = yesterday.getMonthValue();

        log.info("리포트 대상 월: {}월", lastMonth);

        // 2. 지난달 1일 00:00:00 ~ 지난달 마지막 날 23:59:59 계산
        LocalDate firstDayOfLastMonth = yesterday.withDayOfMonth(1);
        LocalDate lastDayOfLastMonth = yesterday.withDayOfMonth(yesterday.lengthOfMonth());

        LocalDateTime start = LocalDateTime.of(firstDayOfLastMonth, LocalTime.MIN); // 00:00:00
        LocalDateTime end = LocalDateTime.of(lastDayOfLastMonth, LocalTime.MAX);     // 23:59:59

        log.info("검색 기간: {} ~ {}", start, end);

        // 3. COMPLETED 상태의 약속 조회
        List<Appointment> completedAppointments = appointmentRepository
                .findAllByStatusAndScheduledAtBetween(AppointmentStatus.COMPLETED, start, end);

        log.info("완료된 약속 수: {}", completedAppointments.size());

        if (completedAppointments.isEmpty()) {
            log.info("📭 발송할 월간 리포트가 없습니다.");
            return;
        }

        // 4. 유저별로 그룹핑
        Map<User, List<Appointment>> appointmentsByUser = completedAppointments.stream()
                .collect(Collectors.groupingBy(Appointment::getUser));

        log.info("리포트 발송 대상 유저 수: {}", appointmentsByUser.size());

        // 5. 유저별로 이메일 발송
        appointmentsByUser.forEach((user, appointments) -> {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                try {
                    emailService.sendMonthlyReport(
                            user.getEmail(),
                            user.getNickname(),
                            lastMonth,
                            appointments
                    );
                    log.info("✅ 월간 리포트 발송 성공: {} ({}) - {}건",
                            user.getNickname(), user.getEmail(), appointments.size());
                } catch (Exception e) {
                    log.error("❌ 월간 리포트 발송 실패: {} - {}",
                            user.getEmail(), e.getMessage(), e);
                }
            } else {
                log.warn("⚠️ 이메일이 없는 유저: {} (ID: {})",
                        user.getNickname(), user.getId());
            }
        });

        log.info("📊 월간 리포트 스케줄러 실행 완료");
    }
}
