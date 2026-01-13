package com.littleescape.api.scheduler;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final AppointmentRepository appointmentRepository;

    /**
     * 매 시간 실행되는 스케줄러
     * 1. D-1 미션 공개 알림 (CREATED → UNLOCKED)
     * 2. D-3h 리마인더 알림
     */
    @Scheduled(cron = "0 0 * * * *") // 매 시간 정각
    @Transactional
    public void processAppointmentNotifications() {
        log.info("=== 약속 알림 스케줄러 실행 시작 ===");
        
        try {
            // Logic A: D-1 미션 공개 알림
            sendMissionUnlockNotifications();
            
            // Logic B: D-3h 리마인더 알림
            sendReminderNotifications();
            
        } catch (Exception e) {
            log.error("스케줄러 실행 중 오류 발생", e);
        }
        
        log.info("=== 약속 알림 스케줄러 실행 종료 ===");
    }

    /**
     * Logic A: D-1 미션 공개 알림
     * scheduledAt이 정확히 24시간 남은 CREATED 상태의 약속 조회
     */
    private void sendMissionUnlockNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime targetTime = now.plusHours(24);
        
        // 23시간 ~ 25시간 사이 (여유를 두고 조회)
        LocalDateTime startTime = now.plusHours(23);
        LocalDateTime endTime = now.plusHours(25);
        
        log.info("D-1 미션 공개 알림 대상 조회: {} ~ {}", startTime, endTime);
        
        List<Appointment> appointments = appointmentRepository
                .findAllByStatusAndScheduledAtBetween(AppointmentStatus.CREATED, startTime, endTime);
        
        log.info("D-1 미션 공개 알림 대상: {}건", appointments.size());
        
        for (Appointment appointment : appointments) {
            try {
                // 미션 공개 링크 생성
                String magicLink = generateMissionUnlockLink(appointment);
                
                // 문자 발송 (실제 구현 시 SMS API 연동)
                sendSMS(
                    appointment.getUser(),
                    "내일이 약속 날이에요! 미션을 선택해주세요. 👉 " + magicLink
                );
                
                // 상태 변경: CREATED → UNLOCKED
                appointment.setStatus(AppointmentStatus.UNLOCKED);
                appointmentRepository.save(appointment);
                
                log.info("미션 공개 알림 발송 완료: 약속 ID={}, 유저={}", 
                        appointment.getId(), appointment.getUser().getNickname());
                
            } catch (Exception e) {
                log.error("미션 공개 알림 발송 실패: 약속 ID={}", appointment.getId(), e);
            }
        }
    }

    /**
     * Logic B: D-3h 리마인더 알림
     * scheduledAt이 3시간 남은 약속 조회
     */
    private void sendReminderNotifications() {
        LocalDateTime now = LocalDateTime.now();
        
        // 2시간 50분 ~ 3시간 10분 사이 (여유를 두고 조회)
        LocalDateTime startTime = now.plusMinutes(170);
        LocalDateTime endTime = now.plusMinutes(190);
        
        log.info("D-3h 리마인더 알림 대상 조회: {} ~ {}", startTime, endTime);
        
        // ACCEPTED 상태의 약속만 리마인더 발송 (미션 선택 완료된 약속)
        List<Appointment> appointments = appointmentRepository
                .findAllByStatusAndScheduledAtBetween(AppointmentStatus.ACCEPTED, startTime, endTime);
        
        log.info("D-3h 리마인더 알림 대상: {}건", appointments.size());
        
        for (Appointment appointment : appointments) {
            try {
                String placeName = appointment.getPlace() != null 
                        ? appointment.getPlace().getName() 
                        : "약속 장소";
                
                String missionTitle = appointment.getMissionTemplate() != null
                        ? appointment.getMissionTemplate().getTitle()
                        : "미션";
                
                // 문자 발송
                sendSMS(
                    appointment.getUser(),
                    String.format("약속 3시간 전! 잊지 않으셨죠? [%s]에서 [%s] 하러 가요! 🌿", 
                            placeName, missionTitle)
                );
                
                log.info("리마인더 알림 발송 완료: 약속 ID={}, 유저={}", 
                        appointment.getId(), appointment.getUser().getNickname());
                
            } catch (Exception e) {
                log.error("리마인더 알림 발송 실패: 약속 ID={}", appointment.getId(), e);
            }
        }
    }

    /**
     * 미션 공개 링크 생성
     */
    private String generateMissionUnlockLink(Appointment appointment) {
        // TODO: 실제 배포 시 환경변수로 도메인 관리
        String baseUrl = System.getProperty("app.client-base-url");
        return baseUrl + "/mission-select/" + appointment.getUnlockToken();
    }

    /**
     * SMS 발송 (Mock)
     * TODO: 실제 SMS API 연동 (Twilio, AWS SNS, 알리고 등)
     */
    private void sendSMS(com.littleescape.api.domain.User user, String message) {
        // 현재는 로그만 출력
        log.info("📱 SMS 발송 (Mock): 받는사람={}, 메시지={}", user.getNickname(), message);
        
        // 실제 구현 예시:
        // smsService.send(user.getPhoneNumber(), message);
    }
}
