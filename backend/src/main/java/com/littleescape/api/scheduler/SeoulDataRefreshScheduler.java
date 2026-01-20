package com.littleescape.api.scheduler;

import com.littleescape.api.service.SeoulCityPlaceCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 서울시 실시간 도시데이터 자동 갱신 스케줄러
 *
 * 갱신 주기:
 * - 기본: 매 정각 (00분)
 * - 피크타임: 금/토 저녁 18~23시, 10분마다
 * - 데이터 정리: 매일 새벽 3시
 *
 * 동작 방식:
 * 1. SeoulOpenApiService를 통해 120개 장소 순차 호출
 * 2. Rate Limiting 자동 적용 (100ms 딜레이)
 * 3. 개별 실패는 로그만 남기고 계속 진행
 * 4. 응답 데이터를 SeoulCityPlace 엔티티로 변환/저장
 *
 * 장애 대응:
 * - 전체 배치 실패 시에도 다음 스케줄에서 재시도
 * - 개별 장소 조회 실패는 무시하고 계속 진행
 * - 7일 이상 갱신 실패한 데이터는 자동 삭제
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SeoulDataRefreshScheduler {

    private final SeoulCityPlaceCacheService cacheService;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    /**
     * 매 정각 전체 장소 데이터 갱신
     *
     * Cron: "0 0 * * * *"
     * - 초(0) 분(0) 시(*) 일(*) 월(*) 요일(*)
     * - 매일 매 시간 정각에 실행
     *
     * 예: 10:00, 11:00, 12:00, 13:00, ...
     */
    @Scheduled(cron = "0 0 * * * *")
    public void refreshAllPlacesHourly() {
        LocalDateTime startTime = LocalDateTime.now();
        log.info("╔════════════════════════════════════════════════════════╗");
        log.info("║  서울시 도시데이터 정각 갱신 시작                        ║");
        log.info("║  시작 시각: {}                                  ║", startTime.format(TIME_FORMATTER));
        log.info("╚════════════════════════════════════════════════════════╝");

        try {
            // SeoulCityPlaceCacheService에서 배치 갱신 수행
            // - getAllPlacesData()로 120개 장소 순차 호출
            // - Rate Limiting 자동 적용 (100ms 딜레이)
            // - 개별 실패는 내부에서 처리됨
            cacheService.refreshAllPlaces();

            LocalDateTime endTime = LocalDateTime.now();
            long durationSeconds = java.time.Duration.between(startTime, endTime).getSeconds();

            log.info("╔════════════════════════════════════════════════════════╗");
            log.info("║  서울시 도시데이터 정각 갱신 완료                        ║");
            log.info("║  종료 시각: {}                                  ║", endTime.format(TIME_FORMATTER));
            log.info("║  소요 시간: {}초                                       ║", durationSeconds);
            log.info("╚════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("╔════════════════════════════════════════════════════════╗");
            log.error("║  서울시 도시데이터 갱신 실패                            ║");
            log.error("║  에러: {}                                              ║", e.getMessage());
            log.error("╚════════════════════════════════════════════════════════╝", e);

            // 실패해도 다음 스케줄에서 재시도
            // 전체 스케줄러를 중단시키지 않음
        }
    }

    /**
     * 피크타임 빠른 갱신 (금/토 저녁 18~23시, 10분마다)
     *
     * Cron: "0 (star)/10 18-23 * * FRI,SAT"
     * - 초(0) 분(10분마다) 시(18-23) 일(star) 월(star) 요일(FRI,SAT)
     *
     * 예: 금요일 18:00, 18:10, 18:20, ... 23:50
     */
    @Scheduled(cron = "0 */10 18-23 * * FRI,SAT")
    public void refreshAllPlacesPeakTime() {
        LocalDateTime startTime = LocalDateTime.now();
        log.info("╔════════════════════════════════════════════════════════╗");
        log.info("║  🔥 피크타임 빠른 갱신 시작 (금/토 저녁)                 ║");
        log.info("║  시작 시각: {}                                  ║", startTime.format(TIME_FORMATTER));
        log.info("╚════════════════════════════════════════════════════════╝");

        try {
            cacheService.refreshAllPlaces();

            LocalDateTime endTime = LocalDateTime.now();
            long durationSeconds = java.time.Duration.between(startTime, endTime).getSeconds();

            log.info("╔════════════════════════════════════════════════════════╗");
            log.info("║  🔥 피크타임 빠른 갱신 완료                             ║");
            log.info("║  종료 시각: {}                                  ║", endTime.format(TIME_FORMATTER));
            log.info("║  소요 시간: {}초                                       ║", durationSeconds);
            log.info("╚════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("피크타임 갱신 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 오래된 데이터 정리 (매일 새벽 3시)
     *
     * Cron: "0 0 3 * * *"
     * - 초(0) 분(0) 시(3) 일(*) 월(*) 요일(*)
     * - 매일 새벽 3시에 실행
     *
     * 정리 대상:
     * - 7일 이상 갱신되지 않은 무효 데이터
     * - is_valid = false인 오래된 데이터
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupOldData() {
        LocalDateTime now = LocalDateTime.now();
        log.info("╔════════════════════════════════════════════════════════╗");
        log.info("║  🧹 오래된 데이터 정리 시작                             ║");
        log.info("║  실행 시각: {}                                  ║", now.format(TIME_FORMATTER));
        log.info("╚════════════════════════════════════════════════════════╝");

        try {
            cacheService.cleanupOldData();

            log.info("╔════════════════════════════════════════════════════════╗");
            log.info("║  🧹 오래된 데이터 정리 완료                             ║");
            log.info("╚════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("데이터 정리 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 데이터 신선도 체크 (30분마다)
     *
     * Cron: "0 (star)/30 * * * *"
     * - 초(0) 분(30분마다) 시(star) 일(star) 월(star) 요일(star)
     *
     * 예: 10:00, 10:30, 11:00, 11:30, ...
     *
     * 동작:
     * - 60분 이상 갱신되지 않은 데이터 개수 확인
     * - 임계값(50% 이상)을 넘으면 경고 로그
     */
    @Scheduled(cron = "0 */30 * * * *")
    public void checkDataFreshness() {
        try {
            long totalCount = cacheService.getValidPlaceCount();
            var staleData = cacheService.getPlacesNeedingRefresh(60);
            long staleCount = staleData.size();

            if (totalCount == 0) {
                log.warn("⚠️ 캐시된 장소 데이터가 없습니다. 초기 데이터 수집이 필요합니다.");
                return;
            }

            double stalePercentage = (staleCount * 100.0) / totalCount;

            if (stalePercentage > 50) {
                log.warn("╔════════════════════════════════════════════════════════╗");
                log.warn("║  ⚠️ 데이터 신선도 경고                                  ║");
                log.warn("║  오래된 데이터: {}/{}건 ({}%)                   ║",
                    staleCount, totalCount, String.format("%.1f", stalePercentage));
                log.warn("║  API 갱신 상태를 확인하세요!                            ║");
                log.warn("╚════════════════════════════════════════════════════════╝");
            } else {
                log.info("✅ 데이터 신선도 양호: {}/{}건 최신 ({}%)",
                    totalCount - staleCount, totalCount,
                    String.format("%.1f", 100 - stalePercentage));
            }

        } catch (Exception e) {
            log.error("데이터 신선도 체크 실패: {}", e.getMessage(), e);
        }
    }

    /**
     * 혼잡도 통계 로그 (매 시간 15분)
     *
     * Cron: "0 15 * * * *"
     * - 초(0) 분(15) 시(*) 일(*) 월(*) 요일(*)
     *
     * 예: 10:15, 11:15, 12:15, ...
     *
     * 통계 정보:
     * - 전체 유효 장소 수
     * - 혼잡도별 장소 수
     * - 평균 혼잡도
     */
    @Scheduled(cron = "0 15 * * * *")
    public void logCongestionStatistics() {
        try {
            long totalCount = cacheService.getValidPlaceCount();

            if (totalCount == 0) {
                return; // 데이터 없으면 스킵
            }

            long smoothCount = cacheService.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.SMOOTH
            );
            long normalCount = cacheService.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.NORMAL
            );
            long slightlyCrowdedCount = cacheService.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.SLIGHTLY_CROWDED
            );
            long crowdedCount = cacheService.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.CROWDED
            );
            long veryCrowdedCount = cacheService.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.VERY_CROWDED
            );

            Double avgCongestion = cacheService.getAverageCongestionLevel();

            log.info("╔════════════════════════════════════════════════════════╗");
            log.info("║  📊 서울시 혼잡도 현황                                   ║");
            log.info("║  전체: {}개 장소                                        ║", totalCount);
            log.info("║  ────────────────────────────────────────────────     ║");
            log.info("║  여유:       {}개 ({}%)                           ║",
                smoothCount, String.format("%.1f", smoothCount * 100.0 / totalCount));
            log.info("║  보통:       {}개 ({}%)                           ║",
                normalCount, String.format("%.1f", normalCount * 100.0 / totalCount));
            log.info("║  약간 붐빔:   {}개 ({}%)                           ║",
                slightlyCrowdedCount, String.format("%.1f", slightlyCrowdedCount * 100.0 / totalCount));
            log.info("║  붐빔:       {}개 ({}%)                           ║",
                crowdedCount, String.format("%.1f", crowdedCount * 100.0 / totalCount));
            log.info("║  매우 붐빔:   {}개 ({}%)                           ║",
                veryCrowdedCount, String.format("%.1f", veryCrowdedCount * 100.0 / totalCount));
            log.info("║  ────────────────────────────────────────────────     ║");
            log.info("║  평균 혼잡도: {}/5.0                                    ║",
                avgCongestion != null ? String.format("%.2f", avgCongestion) : "N/A");
            log.info("╚════════════════════════════════════════════════════════╝");

        } catch (Exception e) {
            log.error("혼잡도 통계 로그 실패: {}", e.getMessage(), e);
        }
    }
}
