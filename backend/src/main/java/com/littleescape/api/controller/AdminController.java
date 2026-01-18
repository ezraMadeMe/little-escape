package com.littleescape.api.controller;

import com.littleescape.api.service.DataIngestionService;
import com.littleescape.api.service.DataImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
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

    private final DataIngestionService dataIngestionService;
    private final DataImportService dataImportService;

    /**
     * 데이터 수집 수동 트리거
     * 스케줄러 시각(새벽 4시)을 기다리지 않고 즉시 데이터 수집 실행
     * 
     * @return 실행 결과 메시지
     */
    @PostMapping("/ingest")
    @Operation(summary = "데이터 수집 수동 실행", 
               description = "외부 공공 API(KOPIS, 서울시, 도서관)에서 데이터를 즉시 수집합니다.")
    public ResponseEntity<Map<String, Object>> triggerDataIngestion() {
        log.info("========================================");
        log.info("🔧 관리자 요청: 수동 데이터 수집 트리거");
        log.info("========================================");
        
        try {
            // 비동기로 실행하여 응답 지연 방지
            new Thread(() -> {
                try {
                    dataIngestionService.manualTrigger();
                } catch (Exception e) {
                    log.error("수동 데이터 수집 실행 중 오류", e);
                }
            }).start();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "데이터 수집이 시작되었습니다. 로그를 확인해주세요.");
            response.put("note", "백그라운드에서 실행 중입니다. 완료까지 1-2분 소요될 수 있습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("데이터 수집 트리거 실패", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "데이터 수집 시작 실패: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * 헬스체크 엔드포인트
     * 관리자 API가 정상 동작하는지 확인
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
     * POST /api/admin/data/import/seoul-restaurants
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
     * DELETE /api/admin/data/places
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
     * GET /api/admin/data/places/count
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
}
