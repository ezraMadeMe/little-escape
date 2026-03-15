package com.littleescape.api.controller;

import com.littleescape.api.dto.simulation.SimulationRequest;
import com.littleescape.api.dto.simulation.SimulationResponse;
import com.littleescape.api.service.DataCollectionService;
import com.littleescape.api.service.DataImportService;
import com.littleescape.api.service.LibraryApiService;
import com.littleescape.api.service.SimulationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자 전용 API 컨트롤러
 * 데이터 수집, 시스템 관리 등의 기능 제공
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "관리자 API")
public class AdminController {

    private final DataCollectionService dataCollectionService;
    private final DataImportService dataImportService;
    private final SimulationService simulationService;
    private final LibraryApiService libraryApiService;
    private final com.littleescape.api.service.AppointmentService appointmentService;
    private final com.littleescape.api.scheduler.AppointmentScheduler appointmentScheduler;
    private final com.littleescape.api.repository.AppointmentRepository appointmentRepository;

    // ========== 데이터 수집 API ==========

    /**
     * 데이터 수집 수동 트리거 (전체)
     */
    @PostMapping("/ingest")
    @Operation(summary = "데이터 수집 수동 실행 (전체)",
               description = "모든 외부 공공 API에서 데이터를 즉시 수집합니다.")
    public ResponseEntity<Map<String, Object>> triggerDataIngestion() {
        log.info("========================================");
        log.info("🔧 관리자 요청: 수동 데이터 수집 트리거 (전체)");
        log.info("========================================");

        try {
            new Thread(() -> {
                try {
                    dataCollectionService.collectAll();
                } catch (Exception e) {
                    log.error("수동 데이터 수집 실행 중 오류", e);
                }
            }).start();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "전체 데이터 수집이 시작되었습니다. 로그를 확인해주세요.");
            response.put("note", "백그라운드에서 실행 중입니다. 완료까지 3-5분 소요될 수 있습니다.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("데이터 수집 트리거 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "데이터 수집 시작 실패: " + e.getMessage()
            ));
        }
    }

    /**
     * 도서관 데이터 수집
     */
    @PostMapping("/data/collect/libraries")
    @Operation(summary = "도서관 데이터 수집",
               description = "도서관정보나루 API에서 서울 지역 도서관 데이터를 수집합니다.")
    public ResponseEntity<Map<String, Object>> collectLibraries() {
        log.info("🔧 관리자 요청: 도서관 데이터 수집");

        try {
            DataCollectionService.CollectionResult result = dataCollectionService.collectLibraries();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "도서관 데이터 수집 완료");
            response.put("inserted", result.inserted);
            response.put("updated", result.updated);
            response.put("skipped", result.skipped);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("도서관 수집 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false, "message", e.getMessage()));
        }
    }

    /**
     * 인기 대출 도서 수집
     */
    @PostMapping("/data/collect/popular-books")
    @Operation(summary = "인기 대출 도서 수집",
               description = "도서관정보나루 API에서 20-30대 대상 인기 대출 도서를 수집합니다.")
    public ResponseEntity<Map<String, Object>> collectPopularBooks() {
        log.info("🔧 관리자 요청: 인기 대출 도서 수집");

        try {
            DataCollectionService.CollectionResult result = dataCollectionService.collectPopularBooks();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "인기도서 데이터 수집 완료");
            response.put("inserted", result.inserted);
            response.put("skipped", result.skipped);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("인기도서 수집 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false, "message", e.getMessage()));
        }
    }

    /**
     * KOPIS 공연/축제 데이터 수집
     */
    @PostMapping("/data/collect/performances")
    @Operation(summary = "공연/축제 데이터 수집",
               description = "KOPIS API에서 서울 지역 공연/축제 데이터를 수집합니다. (필터링 적용)")
    public ResponseEntity<Map<String, Object>> collectPerformances() {
        log.info("🔧 관리자 요청: 공연/축제 데이터 수집");

        try {
            DataCollectionService.CollectionResult perfResult = dataCollectionService.collectPerformances();
            DataCollectionService.CollectionResult festResult = dataCollectionService.collectFestivals();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공연/축제 데이터 수집 완료");
            response.put("performances", Map.of(
                    "inserted", perfResult.inserted,
                    "updated", perfResult.updated,
                    "filtered", perfResult.filtered,
                    "skipped", perfResult.skipped
            ));
            response.put("festivals", Map.of(
                    "inserted", festResult.inserted,
                    "updated", festResult.updated,
                    "filtered", festResult.filtered,
                    "skipped", festResult.skipped
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("공연/축제 수집 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false, "message", e.getMessage()));
        }
    }

    /**
     * 서울시 문화행사 데이터 수집
     */
    @PostMapping("/data/collect/cultural-events")
    @Operation(summary = "문화행사 데이터 수집",
               description = "서울시 열린데이터 API에서 문화행사 정보를 수집합니다.")
    public ResponseEntity<Map<String, Object>> collectCulturalEvents() {
        log.info("🔧 관리자 요청: 문화행사 데이터 수집");

        try {
            DataCollectionService.CollectionResult eventResult = dataCollectionService.collectSeoulCulturalEvents();
            DataCollectionService.CollectionResult reservationResult = dataCollectionService.collectPublicReservationCulture();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "문화행사 데이터 수집 완료");
            response.put("culturalEvents", Map.of(
                    "inserted", eventResult.inserted,
                    "filtered", eventResult.filtered,
                    "skipped", eventResult.skipped
            ));
            response.put("publicReservation", Map.of(
                    "inserted", reservationResult.inserted,
                    "filtered", reservationResult.filtered,
                    "skipped", reservationResult.skipped
            ));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("문화행사 수집 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false, "message", e.getMessage()));
        }
    }

    /**
     * 서울시 공원 데이터 수집
     */
    @PostMapping("/data/collect/parks")
    @Operation(summary = "공원 데이터 수집",
               description = "서울시 열린데이터 API에서 공원 정보를 수집합니다.")
    public ResponseEntity<Map<String, Object>> collectParks() {
        log.info("🔧 관리자 요청: 공원 데이터 수집");

        try {
            DataCollectionService.CollectionResult result = dataCollectionService.collectSeoulParks();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "공원 데이터 수집 완료");
            response.put("inserted", result.inserted);
            response.put("filtered", result.filtered);
            response.put("skipped", result.skipped);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("공원 수집 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false, "message", e.getMessage()));
        }
    }

    /**
     * 모범음식점 데이터 수집
     */
    @PostMapping("/data/collect/restaurants")
    @Operation(summary = "모범음식점 데이터 수집",
               description = "서울시 열린데이터 API에서 모범음식점 정보를 수집합니다.")
    public ResponseEntity<Map<String, Object>> collectRestaurants() {
        log.info("🔧 관리자 요청: 모범음식점 데이터 수집");

        try {
            DataCollectionService.CollectionResult result = dataCollectionService.collectSeoulRestaurants();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "모범음식점 데이터 수집 완료");
            response.put("inserted", result.inserted);
            response.put("skipped", result.skipped);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("모범음식점 수집 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false, "message", e.getMessage()));
        }
    }

    /**
     * 종료 공연 비활성화
     */
    @PostMapping("/data/deactivate-expired")
    @Operation(summary = "종료 공연 비활성화",
               description = "종료일이 지난 공연/행사를 비활성화합니다.")
    public ResponseEntity<Map<String, Object>> deactivateExpired() {
        log.info("🔧 관리자 요청: 종료 공연 비활성화");

        try {
            int count = dataCollectionService.deactivateExpiredPerformances();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", count + "건의 종료 공연이 비활성화되었습니다.");
            response.put("deactivatedCount", count);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("종료 공연 비활성화 실패", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false, "message", e.getMessage()));
        }
    }

    /**
     * 수집 통계 조회
     */
    @GetMapping("/data/stats")
    @Operation(summary = "수집 통계 조회",
               description = "현재 수집된 데이터의 통계를 조회합니다.")
    public ResponseEntity<DataCollectionService.CollectionStats> getCollectionStats() {
        log.info("🔧 관리자 요청: 수집 통계 조회");

        DataCollectionService.CollectionStats stats = dataCollectionService.getCollectionStats();
        return ResponseEntity.ok(stats);
    }

    // ========== 도서 API 테스트 ==========

    /**
     * 도서 소장/대출 가능 여부 테스트
     */
    @GetMapping("/data/test/book-exist")
    @Operation(summary = "도서 소장/대출 가능 테스트",
               description = "특정 ISBN의 도서를 대출할 수 있는 도서관을 조회합니다.")
    public ResponseEntity<List<LibraryApiService.BookAvailability>> testBookExistence(
            @RequestParam String isbn,
            @RequestParam(defaultValue = "37.5665") Double latitude,
            @RequestParam(defaultValue = "126.9780") Double longitude) {

        log.info("🔧 관리자 요청: 도서 소장 테스트 - ISBN: {}", isbn);

        List<LibraryApiService.BookAvailability> result =
                libraryApiService.checkBookExistence(isbn, latitude, longitude);

        return ResponseEntity.ok(result);
    }

    /**
     * 도서 상세 정보 테스트
     */
    @GetMapping("/data/test/book-detail")
    @Operation(summary = "도서 상세 정보 테스트",
               description = "특정 ISBN의 도서 상세 정보를 조회합니다.")
    public ResponseEntity<LibraryApiService.BookDetail> testBookDetail(
            @RequestParam String isbn) {

        log.info("🔧 관리자 요청: 도서 상세 테스트 - ISBN: {}", isbn);

        LibraryApiService.BookDetail result = libraryApiService.getBookDetail(isbn);

        if (result != null) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    // ========== 기존 API (유지) ==========

    /**
     * 헬스체크 엔드포인트
     */
    @PostMapping("/health")
    @Operation(summary = "관리자 API 헬스체크", description = "관리자 API 서버 상태를 확인합니다.")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("message", "Admin API is running");
        return ResponseEntity.ok(response);
    }

    /**
     * 서울 맛집 데이터 import
     */
    @PostMapping("/data/import/seoul-restaurants")
    @Operation(summary = "서울 맛집 데이터 import",
               description = "Excel 파일로부터 생성된 서울 맛집 데이터를 Places 테이블에 삽입합니다.")
    public ResponseEntity<Map<String, Object>> importSeoulRestaurants() {
        log.info("=== 서울 맛집 데이터 import API 호출 ===");

        int importedCount = dataImportService.importSeoulRestaurants();
        long totalCount = dataImportService.countPlaces();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "서울 맛집 데이터 import 완료");
        response.put("importedCount", importedCount);
        response.put("totalPlacesCount", totalCount);

        return ResponseEntity.ok(response);
    }

    /**
     * Places 테이블 전체 삭제 (개발용)
     */
    @DeleteMapping("/data/places")
    @Operation(summary = "Places 테이블 전체 삭제",
               description = "⚠️ 주의: Places 테이블의 모든 데이터를 삭제합니다. (개발용)")
    public ResponseEntity<Map<String, Object>> clearAllPlaces() {
        log.warn("⚠️ Places 테이블 전체 삭제 API 호출");

        long beforeCount = dataImportService.countPlaces();
        dataImportService.clearAllPlaces();
        long afterCount = dataImportService.countPlaces();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Places 테이블의 모든 데이터가 삭제되었습니다");
        response.put("deletedCount", beforeCount);
        response.put("remainingCount", afterCount);

        return ResponseEntity.ok(response);
    }

    /**
     * Places 테이블 데이터 개수 조회
     */
    @GetMapping("/data/places/count")
    @Operation(summary = "Places 데이터 개수 조회",
               description = "현재 Places 테이블에 저장된 총 데이터 개수를 조회합니다.")
    public ResponseEntity<Map<String, Object>> getPlacesCount() {
        long count = dataImportService.countPlaces();

        Map<String, Object> response = new HashMap<>();
        response.put("totalPlacesCount", count);

        return ResponseEntity.ok(response);
    }

    /**
     * 약속 만료 체크 수동 실행
     */
    @PostMapping("/scheduler/check-expired")
    @Operation(summary = "약속 만료 체크 수동 실행",
               description = "스케줄러를 기다리지 않고 즉시 만료된 약속을 체크하고 EXPIRED 상태로 변경합니다.")
    public ResponseEntity<Map<String, Object>> triggerExpiredCheck() {
        log.info("========================================");
        log.info("🔧 관리자 요청: 약속 만료 체크 수동 실행");
        log.info("========================================");

        try {
            appointmentScheduler.checkExpiredAppointments();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "약속 만료 체크가 완료되었습니다. 로그를 확인해주세요.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("약속 만료 체크 실행 중 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "약속 만료 체크 실패: " + e.getMessage()
            ));
        }
    }

    /**
     * 완료된 약속을 모두 공개 상태로 변경
     */
    @PostMapping("/fix-public-status")
    @Operation(summary = "완료된 약속 공개 상태 수정",
               description = "COMPLETED 상태인 모든 약속의 isPublic을 true로 변경합니다.")
    public ResponseEntity<Map<String, Object>> fixPublicStatus() {
        log.info("========================================");
        log.info("🔧 관리자 요청: 완료된 약속 공개 상태 수정");
        log.info("========================================");

        try {
            java.util.List<com.littleescape.api.domain.Appointment> completedAppointments =
                appointmentRepository.findAll().stream()
                    .filter(a -> a.getStatus() == com.littleescape.api.domain.type.AppointmentStatus.COMPLETED)
                    .collect(java.util.stream.Collectors.toList());

            log.info("완료된 약속 개수: {}", completedAppointments.size());

            int updatedCount = 0;
            for (com.littleescape.api.domain.Appointment appointment : completedAppointments) {
                if (!appointment.isPublic()) {
                    appointment.setPublic(true);
                    appointmentRepository.save(appointment);
                    updatedCount++;
                }
            }

            log.info("✅ 공개 상태로 변경된 약속 개수: {}", updatedCount);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("totalCompleted", completedAppointments.size());
            response.put("updated", updatedCount);
            response.put("message", updatedCount + "개의 완료된 약속을 공개 상태로 변경했습니다.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("공개 상태 수정 중 오류", e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "공개 상태 수정 실패: " + e.getMessage()
            ));
        }
    }

    /**
     * 약속 시간 타임 트래블 (현재로 당기기)
     */
    @PatchMapping("/appointments/{id}/time-travel")
    @Operation(summary = "약속 시간 타임 트래블",
               description = "해당 약속의 예정 시간을 현재 시간으로 변경합니다. (개발/QA용)")
    public ResponseEntity<Map<String, Object>> timeTravel(@PathVariable Long id) {
        log.info("🔧 관리자 요청: 약속 {} 타임 트래블", id);

        try {
            appointmentService.adminTimeTravel(id);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "약속 시간이 현재로 변경되었습니다.");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("타임 트래블 실행 중 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * God Mode Simulation API
     */
    @PostMapping("/simulation")
    @Operation(
        summary = "God Mode Simulation - 추천 로직 테스트",
        description = """
            모든 환경 변수(시간, 날씨, 혼잡도 등)를 통제하여 추천 로직을 테스트합니다.

            **사용 사례:**
            - 월요일 도서관 필터링 검증
            - 비오는 날 실내 장소 추천 검증
            - 야간 시간대 전시 제외 검증
            - 혼잡도에 따른 조용한 장소 우선순위 검증
            - 솔로 레벨에 따른 난이도 필터링 검증

            **디버그 로그:**
            응답에 포함된 debugLogs 배열로 필터링 과정을 상세히 확인할 수 있습니다.
            """
    )
    public ResponseEntity<SimulationResponse> runSimulation(
            @RequestBody SimulationRequest request) {

        log.info("========================================");
        log.info("🎮 God Mode Simulation API 호출");
        log.info("========================================");
        log.info("요청 파라미터: {}", request);

        try {
            SimulationResponse response = simulationService.runSimulation(request);

            log.info("시뮬레이션 완료 - 추천된 미션: {}",
                    response.mission() != null ? response.mission().title() : "없음");
            log.info("시뮬레이션 완료 - 추천된 장소: {}",
                    response.place() != null ? response.place().name() : "없음");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("시뮬레이션 실행 중 오류 발생", e);

            SimulationResponse errorResponse = new SimulationResponse(
                null,
                null,
                List.of("❌ 시뮬레이션 실행 실패: " + e.getMessage()),
                List.of(new SimulationResponse.StageInfo(
                        "SIMULATION_ERROR",
                        "Simulation error",
                        "RESULT",
                        0,
                        0,
                        List.of(new SimulationResponse.ReasonInfo(
                                "SIMULATION_EXCEPTION",
                                0,
                                0,
                                e.getMessage()
                        )),
                        List.of()
                )),
                0, 0, 0, 0,
                List.of(),
                List.of()
            );

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
