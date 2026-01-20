package com.littleescape.api.controller;

import com.littleescape.api.dto.seoul.SeoulCityDataResponse;
import com.littleescape.api.service.SeoulOpenApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * 서울시 실시간 도시데이터 API 컨트롤러
 *
 * 테스트 및 개발용 엔드포인트
 *
 * 주요 엔드포인트:
 * - GET /api/v1/seoul/city-data/{placeCode} - 장소 코드로 조회
 * - GET /api/v1/seoul/city-data/by-name/{placeName} - 장소명으로 조회
 * - GET /api/v1/seoul/city-data/batch - 전체 장소 배치 조회
 * - POST /api/v1/seoul/city-data/batch - 특정 장소 목록 조회
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/seoul/city-data")
@RequiredArgsConstructor
public class SeoulCityDataController {

    private final SeoulOpenApiService seoulOpenApiService;

    /**
     * 장소 코드로 실시간 도시 데이터 조회
     *
     * 예시:
     * GET /api/v1/seoul/city-data/POI001
     *
     * @param placeCode 장소 코드
     * @return 도시 데이터 응답
     */
    @GetMapping("/{placeCode}")
    public Mono<ResponseEntity<SeoulCityDataResponse>> getCityData(
            @PathVariable String placeCode
    ) {
        log.info("=== 도시데이터 조회 요청 === 장소 코드: {}", placeCode);

        return seoulOpenApiService.getCityDataByPlaceCode(placeCode)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build())
                .doOnSuccess(response ->
                    log.info("=== 조회 완료 === Status: {}", response.getStatusCode())
                )
                .onErrorResume(error -> {
                    log.error("=== 조회 실패 === {}", error.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    /**
     * 장소명으로 실시간 도시 데이터 조회
     *
     * 예시:
     * GET /api/v1/seoul/city-data/by-name/명동
     *
     * @param placeName 장소명
     * @return 도시 데이터 응답
     */
    @GetMapping("/by-name/{placeName}")
    public Mono<ResponseEntity<SeoulCityDataResponse>> getCityDataByName(
            @PathVariable String placeName
    ) {
        log.info("=== 장소명으로 조회 === 장소: {}", placeName);

        return seoulOpenApiService.getCityDataByPlaceName(placeName)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build())
                .onErrorResume(error -> {
                    log.error("=== 조회 실패 === {}", error.getMessage());
                    return Mono.just(ResponseEntity.internalServerError().build());
                });
    }

    /**
     * 전체 주요 장소 배치 조회
     *
     * 주의: 시간이 오래 걸릴 수 있음 (Rate Limiting 적용)
     *
     * 예시:
     * GET /api/v1/seoul/city-data/batch
     *
     * @return 전체 장소의 도시 데이터 스트림
     */
    @GetMapping("/batch")
    public Flux<SeoulCityDataResponse> getAllPlacesData() {
        log.info("=== 전체 장소 배치 조회 요청 ===");

        return seoulOpenApiService.getAllPlacesData()
                .doOnComplete(() ->
                    log.info("=== 배치 조회 완료 ===")
                );
    }

    /**
     * 특정 장소 목록 배치 조회
     *
     * 예시:
     * POST /api/v1/seoul/city-data/batch
     * Body: ["POI001", "POI002", "POI003"]
     *
     * @param placeCodes 조회할 장소 코드 목록
     * @return 도시 데이터 스트림
     */
    @PostMapping("/batch")
    public Flux<SeoulCityDataResponse> getBatchCityData(
            @RequestBody List<String> placeCodes
    ) {
        log.info("=== 커스텀 배치 조회 요청 === 총 {}개 장소", placeCodes.size());

        return seoulOpenApiService.getBatchCityData(placeCodes)
                .doOnComplete(() ->
                    log.info("=== 커스텀 배치 조회 완료 ===")
                );
    }

    /**
     * 헬스 체크 엔드포인트
     *
     * 서비스 정상 작동 여부 확인
     *
     * @return 상태 메시지
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Seoul City Data API Service is running");
    }
}
