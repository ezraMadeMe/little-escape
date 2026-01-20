package com.littleescape.api.scheduler;

import com.littleescape.api.domain.Appointment;
import com.littleescape.api.domain.MissionTemplate;
import com.littleescape.api.domain.SeoulCityPlace;
import com.littleescape.api.domain.type.AppointmentStatus;
import com.littleescape.api.domain.type.LocationType;
import com.littleescape.api.repository.AppointmentRepository;
import com.littleescape.api.repository.MissionTemplateRepository;
import com.littleescape.api.repository.SeoulCityPlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;

/**
 * 악천후 예보 시 약속 자동 변경 스케줄러
 *
 * 동작 시간: 매일 오전 6시
 *
 * 주요 기능:
 * 1. 다음날 예정된 약속 중 야외 미션 체크
 * 2. 해당 장소의 날씨가 비/눈일 경우 실내 미션으로 자동 전환
 * 3. 사용자에게 푸시 알림 발송
 * 4. AppointmentStatus를 PLAN_B_ACTIVATED로 변경
 *
 * 예외 처리:
 * - 이미 출발(ARRIVED)한 약속은 변경하지 않음
 * - 완료/취소/불참 상태는 무시
 * - 날씨 정보가 없으면 변경하지 않음
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WeatherBasedPlanBScheduler {

    private final AppointmentRepository appointmentRepository;
    private final MissionTemplateRepository missionTemplateRepository;
    private final SeoulCityPlaceRepository seoulCityPlaceRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /**
     * 매일 오전 6시 실행
     * 다음날 약속 중 악천후 예상 시 Plan B로 전환
     *
     * Cron: "0 0 6 * * ?"
     * - 초(0) 분(0) 시(6) 일(*) 월(*) 요일(?)
     */
    @Scheduled(cron = "0 0 6 * * ?")
    @Transactional
    public void checkWeatherAndUpdatePlans() {
        LocalDateTime startTime = LocalDateTime.now();
        log.info("╔════════════════════════════════════════════════════════╗");
        log.info("║  🌦️  악천후 자동 Plan B 스케줄러 실행 시작              ║");
        log.info("║  시작 시각: {}                                  ║", startTime.format(TIME_FORMATTER));
        log.info("╚════════════════════════════════════════════════════════╝");

        try {
            // 1. 내일(tomorrow) 예정된 약속 조회
            LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
            LocalDateTime tomorrowStart = tomorrow.withHour(0).withMinute(0).withSecond(0);
            LocalDateTime tomorrowEnd = tomorrow.withHour(23).withMinute(59).withSecond(59);

            log.info("내일 예정 약속 조회 범위: {} ~ {}",
                    tomorrowStart.format(DATE_FORMATTER),
                    tomorrowEnd.format(DATE_FORMATTER));

            List<Appointment> tomorrowAppointments = appointmentRepository
                    .findAllByScheduledAtBetween(tomorrowStart, tomorrowEnd);

            log.info("내일 예정된 약속: {}건", tomorrowAppointments.size());

            if (tomorrowAppointments.isEmpty()) {
                log.info("내일 예정된 약속이 없습니다. 스케줄러 종료.");
                return;
            }

            // 2. 각 약속에 대해 날씨 확인 및 Plan B 전환
            int changedCount = 0;
            int skippedCount = 0;

            for (Appointment appointment : tomorrowAppointments) {
                try {
                    boolean changed = processAppointment(appointment);
                    if (changed) {
                        changedCount++;
                    } else {
                        skippedCount++;
                    }
                } catch (Exception e) {
                    log.error("약속 처리 중 오류 발생: 약속 ID={}, 오류={}",
                            appointment.getId(), e.getMessage(), e);
                    skippedCount++;
                }
            }

            LocalDateTime endTime = LocalDateTime.now();
            long durationSeconds = java.time.Duration.between(startTime, endTime).getSeconds();

            log.info("╔════════════════════════════════════════════════════════╗");
            log.info("║  🌦️  악천후 자동 Plan B 스케줄러 실행 완료              ║");
            log.info("║  종료 시각: {}                                  ║", endTime.format(TIME_FORMATTER));
            log.info("║  소요 시간: {}초                                       ║", durationSeconds);
            log.info("║  ────────────────────────────────────────────────     ║");
            log.info("║  전환 완료: {}건                                       ║", changedCount);
            log.info("║  스킵: {}건                                            ║", skippedCount);
            log.info("╚════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("╔════════════════════════════════════════════════════════╗");
            log.error("║  악천후 Plan B 스케줄러 실행 실패                       ║");
            log.error("║  에러: {}                                              ║", e.getMessage());
            log.error("╚════════════════════════════════════════════════════════╝", e);
        }
    }

    /**
     * 개별 약속 처리 로직
     *
     * @param appointment 처리할 약속
     * @return true = Plan B로 전환됨, false = 전환 안 함 (스킵)
     */
    private boolean processAppointment(Appointment appointment) {
        log.info("─────────────────────────────────────────────────────────");
        log.info("약속 처리 시작: ID={}, 유저={}, 시간={}",
                appointment.getId(),
                appointment.getUser().getNickname(),
                appointment.getScheduledAt().format(DATE_FORMATTER));

        // 1. 상태 체크: 변경 불가능한 상태는 스킵
        if (!isChangeable(appointment)) {
            log.info("→ 스킵: 변경 불가능한 상태 ({})", appointment.getStatus());
            return false;
        }

        // 2. 미션 체크: 야외 미션이 아니면 스킵
        MissionTemplate currentMission = appointment.getMissionTemplate();
        if (currentMission == null) {
            log.info("→ 스킵: 미션이 아직 선택되지 않음");
            return false;
        }

        if (currentMission.getLocationType() != LocationType.OUTDOOR) {
            log.info("→ 스킵: 실내 미션이므로 변경 불필요 ({})", currentMission.getLocationType());
            return false;
        }

        // 3. 날씨 체크: 악천후가 아니면 스킵
        if (!isBadWeather(appointment)) {
            log.info("→ 스킵: 날씨 양호 (비/눈 예보 없음)");
            return false;
        }

        // 4. 대체 미션 찾기
        Optional<MissionTemplate> alternativeMission = findIndoorAlternative(currentMission, appointment);
        if (alternativeMission.isEmpty()) {
            log.warn("→ 스킵: 대체 가능한 실내 미션을 찾지 못함");
            return false;
        }

        // 5. 미션 교체 및 상태 변경
        MissionTemplate planB = alternativeMission.get();
        appointment.setMissionTemplate(planB);
        appointment.setStatus(AppointmentStatus.PLAN_B_ACTIVATED);
        appointmentRepository.save(appointment);

        log.info("→ ✅ Plan B 전환 완료");
        log.info("   • 기존 미션: {} ({})", currentMission.getTitle(), currentMission.getLocationType());
        log.info("   • 새 미션: {} ({})", planB.getTitle(), planB.getLocationType());

        // 6. 알림 발송
        sendPlanBNotification(appointment, currentMission, planB);

        return true;
    }

    /**
     * 약속 상태가 변경 가능한지 확인
     *
     * 변경 불가능한 상태:
     * - ARRIVED (이미 출발함)
     * - COMPLETED (완료됨)
     * - CANCELLED (취소됨)
     * - NO_SHOW (불참)
     * - PLAN_B_ACTIVATED (이미 Plan B로 전환됨)
     *
     * @param appointment 약속
     * @return true = 변경 가능, false = 변경 불가
     */
    private boolean isChangeable(Appointment appointment) {
        AppointmentStatus status = appointment.getStatus();
        return status != AppointmentStatus.ARRIVED &&
               status != AppointmentStatus.COMPLETED &&
               status != AppointmentStatus.CANCELLED &&
               status != AppointmentStatus.NO_SHOW &&
               status != AppointmentStatus.PLAN_B_ACTIVATED;
    }

    /**
     * 악천후 여부 확인
     *
     * 체크 기준:
     * 1. 약속 장소 근처의 서울시 도시데이터 조회
     * 2. isRainy() 또는 isSnowy() 확인
     *
     * @param appointment 약속
     * @return true = 악천후 (비/눈), false = 날씨 양호
     */
    private boolean isBadWeather(Appointment appointment) {
        // 사용자 출발 위치가 없으면 약속 장소(Place) 위치 사용
        Double latitude = appointment.getDepartureLatitude();
        Double longitude = appointment.getDepartureLongitude();

        if (latitude == null || longitude == null) {
            if (appointment.getPlace() != null) {
                latitude = appointment.getPlace().getLatitude();
                longitude = appointment.getPlace().getLongitude();
            }
        }

        if (latitude == null || longitude == null) {
            log.warn("위치 정보 없음 → 날씨 확인 불가");
            return false;
        }

        // 가장 가까운 서울시 장소 찾기
        Optional<SeoulCityPlace> nearestPlace = seoulCityPlaceRepository.findNearestPlace(
                latitude, longitude
        );

        if (nearestPlace.isEmpty()) {
            log.warn("근처 서울시 도시데이터 없음 → 날씨 확인 불가");
            return false;
        }

        SeoulCityPlace place = nearestPlace.get();
        boolean isRainy = place.isRainy();
        boolean isSnowy = place.isSnowy();

        log.info("날씨 정보: 장소={}, 비={}, 눈={}", place.getPlaceName(), isRainy, isSnowy);

        return isRainy || isSnowy;
    }

    /**
     * 실내 대체 미션 찾기
     *
     * 우선순위:
     * 1. 같은 카테고리의 실내 미션
     * 2. 같은 시간대의 실내 미션
     * 3. 위치가 가까운 실내 미션
     *
     * @param outdoor 기존 야외 미션
     * @param appointment 약속 정보
     * @return 대체 실내 미션 (없으면 Optional.empty)
     */
    private Optional<MissionTemplate> findIndoorAlternative(
            MissionTemplate outdoor,
            Appointment appointment
    ) {
        log.info("실내 대체 미션 검색 시작: 기존 미션={}", outdoor.getTitle());

        // 1. 같은 카테고리 + 같은 시간대 + 실내
        List<MissionTemplate> candidates = missionTemplateRepository
                .findByCategoryAndTimeOfDayAndLocationType(
                        outdoor.getCategory(),
                        outdoor.getTimeOfDay(),
                        LocationType.INDOOR
                );

        log.info("같은 카테고리+시간대 실내 미션: {}개", candidates.size());

        if (!candidates.isEmpty()) {
            // 기존 미션과 다른 것 중 랜덤 선택
            candidates = candidates.stream()
                    .filter(m -> !m.getId().equals(outdoor.getId()))
                    .toList();

            if (!candidates.isEmpty()) {
                Random random = new Random();
                return Optional.of(candidates.get(random.nextInt(candidates.size())));
            }
        }

        // 2. 같은 시간대 + 실내 (카테고리 무관)
        candidates = missionTemplateRepository
                .findByTimeOfDayAndLocationType(
                        outdoor.getTimeOfDay(),
                        LocationType.INDOOR
                );

        log.info("같은 시간대 실내 미션: {}개", candidates.size());

        if (!candidates.isEmpty()) {
            Random random = new Random();
            return Optional.of(candidates.get(random.nextInt(candidates.size())));
        }

        // 3. 모든 실내 미션 중 랜덤 선택
        candidates = missionTemplateRepository.findByLocationType(LocationType.INDOOR);

        log.info("전체 실내 미션: {}개", candidates.size());

        if (!candidates.isEmpty()) {
            Random random = new Random();
            return Optional.of(candidates.get(random.nextInt(candidates.size())));
        }

        return Optional.empty();
    }

    /**
     * Plan B 전환 알림 발송
     *
     * TODO: 실제 SMS/Push 알림 연동
     * - CoolSMS API
     * - Firebase Cloud Messaging (FCM)
     * - AWS SNS
     *
     * @param appointment 약속
     * @param originalMission 기존 미션
     * @param planBMission 새 미션
     */
    private void sendPlanBNotification(
            Appointment appointment,
            MissionTemplate originalMission,
            MissionTemplate planBMission
    ) {
        String userName = appointment.getUser().getNickname();
        String scheduledTime = appointment.getScheduledAt().format(DATE_FORMATTER);

        String message = String.format(
                "안녕하세요 %s님! 내일(%s) 예정된 약속에 비/눈 예보가 있어요. " +
                "야외 미션 '%s'을 실내 미션 '%s'로 변경했어요. 편하게 즐겨주세요! 🌂",
                userName,
                scheduledTime,
                originalMission.getTitle(),
                planBMission.getTitle()
        );

        // 현재는 로그만 출력
        log.info("📱 Plan B 알림 발송 (Mock): 받는사람={}, 메시지={}", userName, message);

        // 실제 구현 예시:
        // smsService.send(appointment.getUser().getPhoneNumber(), message);
        // pushService.send(appointment.getUser().getId(), "악천후 Plan B 알림", message);
    }
}
