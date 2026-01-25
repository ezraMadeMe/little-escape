package com.littleescape.api.scheduler;

import com.littleescape.api.repository.LibraryRepository;
import com.littleescape.api.repository.PlaceRepository;
import com.littleescape.api.service.DataCollectionService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 공공 데이터 수집 스케줄러
 *
 * 수집 스케줄:
 * 1. 매주 월요일 새벽 4시: 인기도서, 공연/축제
 * 2. 매일 새벽 5시: 문화행사, 공공예약, 종료 공연 비활성화
 * 3. 앱 시작 시 1회: 도서관, 공원 (데이터 없을 때만)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataCollectionScheduler {

    private final DataCollectionService dataCollectionService;
    private final PlaceRepository placeRepository;
    private final LibraryRepository libraryRepository;

    @Value("${data-ingestion.enabled:true}")
    private boolean ingestionEnabled;

    @Value("${data-ingestion.schedule.enabled:true}")
    private boolean scheduleEnabled;

    /**
     * 앱 시작 시 기본 데이터 수집 (데이터 없을 때만)
     */
    @PostConstruct
    public void initializeData() {
        if (!ingestionEnabled || !scheduleEnabled) {
            log.info("⏸️ 데이터 수집 스케줄러 비활성화됨");
            return;
        }

        log.info("🚀 앱 시작 - 기본 데이터 초기화 확인 중...");

        // 도서관 데이터 없으면 수집
        if (libraryRepository.count() == 0) {
            log.info("📚 도서관 데이터 없음 - 초기 수집 시작");
            try {
                dataCollectionService.collectLibraries();
            } catch (Exception e) {
                log.error("도서관 초기 수집 실패", e);
            }
        } else {
            log.info("📚 도서관 데이터 존재: {}건", libraryRepository.count());
        }

        // 공원 데이터 없으면 수집
        long parkCount = placeRepository.countByDataSource(
                com.littleescape.api.domain.type.DataSource.SEOUL_PARK);
        if (parkCount == 0) {
            log.info("🌳 공원 데이터 없음 - 초기 수집 시작");
            try {
                dataCollectionService.collectSeoulParks();
            } catch (Exception e) {
                log.error("공원 초기 수집 실패", e);
            }
        } else {
            log.info("🌳 공원 데이터 존재: {}건", parkCount);
        }

        log.info("✅ 기본 데이터 초기화 완료");
    }

    /**
     * 매주 월요일 새벽 4시: 인기도서 + 공연/축제 수집
     * 주간 단위로 변경되는 데이터
     */
    @Scheduled(cron = "0 0 4 * * MON")
    public void weeklyCollection() {
        if (!ingestionEnabled || !scheduleEnabled) {
            return;
        }

        log.info("========================================");
        log.info("📅 주간 데이터 수집 시작 (매주 월요일)");
        log.info("========================================");

        try {
            // 인기 대출 도서 수집
            log.info("📚 인기 대출 도서 수집...");
            DataCollectionService.CollectionResult bookResult = dataCollectionService.collectPopularBooks();
            log.info("인기도서: {}", bookResult);

            // KOPIS 공연 수집
            log.info("🎭 KOPIS 공연 수집...");
            DataCollectionService.CollectionResult perfResult = dataCollectionService.collectPerformances();
            log.info("공연: {}", perfResult);

            // KOPIS 축제 수집
            log.info("🎪 KOPIS 축제 수집...");
            DataCollectionService.CollectionResult festResult = dataCollectionService.collectFestivals();
            log.info("축제: {}", festResult);

            log.info("========================================");
            log.info("✅ 주간 데이터 수집 완료");
            log.info("========================================");

        } catch (Exception e) {
            log.error("❌ 주간 데이터 수집 실패", e);
        }
    }

    /**
     * 매일 새벽 5시: 문화행사 + 공공예약 + 종료 공연 처리
     * 일간 단위로 변경되는 데이터
     */
    @Scheduled(cron = "0 0 5 * * *")
    public void dailyCollection() {
        if (!ingestionEnabled || !scheduleEnabled) {
            return;
        }

        log.info("========================================");
        log.info("📅 일간 데이터 수집 시작 (매일)");
        log.info("========================================");

        try {
            // 종료된 공연 비활성화
            log.info("🔄 종료 공연 비활성화...");
            int deactivatedCount = dataCollectionService.deactivateExpiredPerformances();
            log.info("비활성화: {}건", deactivatedCount);

            // 서울시 문화행사 수집
            log.info("🎭 서울시 문화행사 수집...");
            DataCollectionService.CollectionResult eventResult = dataCollectionService.collectSeoulCulturalEvents();
            log.info("문화행사: {}", eventResult);

            // 서울시 공공예약 문화행사 수집
            log.info("🎫 서울시 공공예약 수집...");
            DataCollectionService.CollectionResult reservationResult = dataCollectionService.collectPublicReservationCulture();
            log.info("공공예약: {}", reservationResult);

            // 모범음식점 수집 (일 1회)
            log.info("🍽️ 모범음식점 수집...");
            DataCollectionService.CollectionResult restaurantResult = dataCollectionService.collectSeoulRestaurants();
            log.info("모범음식점: {}", restaurantResult);

            log.info("========================================");
            log.info("✅ 일간 데이터 수집 완료");
            log.info("========================================");

        } catch (Exception e) {
            log.error("❌ 일간 데이터 수집 실패", e);
        }
    }

    /**
     * 매월 1일 새벽 3시: 기준 데이터 갱신
     * 도서관, 공원 등 거의 변경되지 않는 데이터
     */
    @Scheduled(cron = "0 0 3 1 * *")
    public void monthlyCollection() {
        if (!ingestionEnabled || !scheduleEnabled) {
            return;
        }

        log.info("========================================");
        log.info("📅 월간 데이터 갱신 시작 (매월 1일)");
        log.info("========================================");

        try {
            // 도서관 데이터 갱신
            log.info("📚 도서관 데이터 갱신...");
            DataCollectionService.CollectionResult libraryResult = dataCollectionService.collectLibraries();
            log.info("도서관: {}", libraryResult);

            // 공원 데이터 갱신
            log.info("🌳 공원 데이터 갱신...");
            DataCollectionService.CollectionResult parkResult = dataCollectionService.collectSeoulParks();
            log.info("공원: {}", parkResult);

            log.info("========================================");
            log.info("✅ 월간 데이터 갱신 완료");
            log.info("========================================");

        } catch (Exception e) {
            log.error("❌ 월간 데이터 갱신 실패", e);
        }
    }
}
