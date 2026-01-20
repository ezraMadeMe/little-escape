package com.littleescape.api.service;

import com.littleescape.api.config.SeoulOpenApiProperties;
import com.littleescape.api.dto.seoul.SeoulCityDataResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

/**
 * 서울시 실시간 도시데이터 API 연동 서비스
 *
 * API 문서: https://data.seoul.go.kr/dataList/OA-21285/F/1/datasetView.do
 *
 * 주요 기능:
 * 1. 장소 코드 기반 실시간 혼잡도 조회
 * 2. 장소명 기반 도시 데이터 조회
 * 3. 전체 장소 배치 조회 (120개 주요 장소)
 *
 * Rate Limiting:
 * - 최소 호출 간격: 100ms (기본값)
 * - Flux.delayElements()로 구현
 *
 * 에러 처리:
 * - 타임아웃: 5초 (설정 가능)
 * - 401/403: 인증 오류
 * - 500: 서버 오류
 * - 재시도: 최대 2회 (지수 백오프)
 */
@Slf4j
@Service
public class SeoulOpenApiService {

    private final WebClient webClient;
    private final SeoulOpenApiProperties properties;

    /**
     * 서울시 주요 장소 코드 목록 (120개)
     *
     * 주요 지역:
     * - 명동, 홍대, 강남역, 이태원, 삼청동
     * - 경복궁, 북촌, 익선동, 성수동, 잠실
     * - 여의도, 동대문, 광화문, 종로, 신촌
     *
     * TODO: 실제 운영 시 전체 120개 장소 코드 추가 필요
     */
    private static final List<String> MAJOR_PLACE_CODES = Arrays.asList(
        "POI001",   // 명동
        "POI002",   // 홍대입구역
        "POI003",   // 강남역
        "POI004",   // 이태원
        "POI005",   // 삼청동
        "POI006",   // 경복궁
        "POI007",   // 북촌한옥마을
        "POI008",   // 익선동
        "POI009",   // 성수동
        "POI010"    // 잠실종합운동장
        // ... 나머지 110개 장소 코드 추가 예정
    );

    public SeoulOpenApiService(SeoulOpenApiProperties properties) {
        this.properties = properties;
        this.webClient = WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();

        log.info("=== SeoulOpenApiService 초기화 완료 ===");
        log.info("Base URL: {}", properties.getBaseUrl());
        log.info("Response Type: {}", properties.getResponseType());
        log.info("Service Name: {}", properties.getServiceName());
        log.info("Rate Limit Delay: {}ms", properties.getRateLimitDelayMillis());
    }

    /**
     * 장소 코드로 실시간 도시 데이터 조회
     *
     * API URL 형식:
     * http://openapi.seoul.go.kr:8088/{인증키}/json/citydata/1/5/{장소코드}
     *
     * @param placeCode 장소 코드 (예: "POI001")
     * @return 도시 데이터 응답
     */
    public Mono<SeoulCityDataResponse> getCityDataByPlaceCode(String placeCode) {
        if (placeCode == null || placeCode.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("장소 코드는 필수입니다."));
        }

        String uri = buildUri(placeCode);
        log.info("=== 서울시 도시데이터 API 호출 시작 === 장소 코드: {}", placeCode);
        log.debug("Request URI: {}", uri);

        return webClient.get()
                .uri(uri)
                .retrieve()
                .onStatus(
                    status -> status.value() == 401 || status.value() == 403,
                    response -> {
                        log.error("인증 오류 발생: Status {}", response.statusCode());
                        return Mono.error(new SeoulApiException(
                            "서울시 API 인증에 실패했습니다. API 키를 확인해주세요.",
                            response.statusCode().value()
                        ));
                    }
                )
                .onStatus(
                    status -> status.is5xxServerError(),
                    response -> {
                        log.error("서버 오류 발생: Status {}", response.statusCode());
                        return Mono.error(new SeoulApiException(
                            "서울시 API 서버에 문제가 발생했습니다.",
                            response.statusCode().value()
                        ));
                    }
                )
                .bodyToMono(SeoulCityDataResponse.class)
                .timeout(Duration.ofMillis(properties.getTimeoutMillis()))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1))
                    .filter(throwable -> !(throwable instanceof SeoulApiException))
                    .doBeforeRetry(retrySignal ->
                        log.warn("재시도 중... ({}/2) - {}",
                            retrySignal.totalRetries() + 1,
                            retrySignal.failure().getMessage())
                    )
                )
                .doOnSuccess(response -> {
                    if (response != null && response.result() != null) {
                        log.info("=== API 호출 성공 === 장소: {} ({})",
                            response.cityData() != null ? response.cityData().poiName() : "알 수 없음",
                            placeCode);
                        log.debug("응답 코드: {} - {}",
                            response.result().code(),
                            response.result().message());
                    }
                })
                .doOnError(error -> {
                    if (error instanceof WebClientResponseException) {
                        WebClientResponseException ex = (WebClientResponseException) error;
                        log.error("=== API 호출 실패 === Status: {} Body: {}",
                            ex.getStatusCode(),
                            ex.getResponseBodyAsString());
                    } else {
                        log.error("=== API 호출 실패 === 에러: {}", error.getMessage(), error);
                    }
                });
    }

    /**
     * 장소명으로 도시 데이터 조회
     *
     * 장소명을 장소 코드로 변환 후 조회
     *
     * TODO: 실제 운영 시 장소명 → 장소코드 매핑 테이블 필요
     *
     * @param placeName 장소명 (예: "명동", "홍대입구역")
     * @return 도시 데이터 응답
     */
    public Mono<SeoulCityDataResponse> getCityDataByPlaceName(String placeName) {
        if (placeName == null || placeName.trim().isEmpty()) {
            return Mono.error(new IllegalArgumentException("장소명은 필수입니다."));
        }

        log.info("=== 장소명으로 조회 === 장소: {}", placeName);

        // 장소명을 URL 인코딩된 형태로 직접 전달
        // API가 장소명을 지원하는 경우 사용
        String uri = buildUriByPlaceName(placeName);
        log.debug("Request URI: {}", uri);

        return webClient.get()
                .uri(uri)
                .retrieve()
                .onStatus(
                    status -> status.value() == 401 || status.value() == 403,
                    response -> Mono.error(new SeoulApiException(
                        "서울시 API 인증에 실패했습니다.",
                        response.statusCode().value()
                    ))
                )
                .onStatus(
                    status -> status.is5xxServerError(),
                    response -> Mono.error(new SeoulApiException(
                        "서울시 API 서버에 문제가 발생했습니다.",
                        response.statusCode().value()
                    ))
                )
                .bodyToMono(SeoulCityDataResponse.class)
                .timeout(Duration.ofMillis(properties.getTimeoutMillis()))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1))
                    .filter(throwable -> !(throwable instanceof SeoulApiException))
                )
                .doOnSuccess(response ->
                    log.info("=== 장소명 조회 성공 === {}", placeName)
                )
                .doOnError(error ->
                    log.error("=== 장소명 조회 실패 === {} - {}", placeName, error.getMessage())
                );
    }

    /**
     * 전체 주요 장소의 도시 데이터 배치 조회
     *
     * Rate Limiting 적용:
     * - 각 요청 사이에 설정된 딜레이 적용 (기본 100ms)
     * - 병렬 처리 대신 순차 처리로 API 부하 방지
     *
     * 사용 시나리오:
     * - 스케줄러로 주기적 전체 데이터 캐싱
     * - 혼잡도 통계 분석
     *
     * @return 전체 장소의 도시 데이터 Flux
     */
    public Flux<SeoulCityDataResponse> getAllPlacesData() {
        log.info("=== 전체 장소 배치 조회 시작 === 총 {}개 장소", MAJOR_PLACE_CODES.size());
        log.info("Rate Limit: {}ms 간격으로 순차 호출", properties.getRateLimitDelayMillis());

        return Flux.fromIterable(MAJOR_PLACE_CODES)
                .delayElements(Duration.ofMillis(properties.getRateLimitDelayMillis()))
                .flatMap(placeCode ->
                    getCityDataByPlaceCode(placeCode)
                        .onErrorResume(error -> {
                            log.warn("장소 {} 조회 실패, 건너뜀: {}", placeCode, error.getMessage());
                            return Mono.empty(); // 개별 실패는 무시하고 계속 진행
                        })
                )
                .doOnComplete(() ->
                    log.info("=== 전체 장소 배치 조회 완료 ===")
                )
                .doOnError(error ->
                    log.error("=== 배치 조회 중 치명적 에러 발생 === {}", error.getMessage(), error)
                );
    }

    /**
     * 특정 장소 코드 목록으로 배치 조회
     *
     * @param placeCodes 조회할 장소 코드 목록
     * @return 도시 데이터 Flux
     */
    public Flux<SeoulCityDataResponse> getBatchCityData(List<String> placeCodes) {
        if (placeCodes == null || placeCodes.isEmpty()) {
            return Flux.empty();
        }

        log.info("=== 커스텀 배치 조회 시작 === 총 {}개 장소", placeCodes.size());

        return Flux.fromIterable(placeCodes)
                .delayElements(Duration.ofMillis(properties.getRateLimitDelayMillis()))
                .flatMap(placeCode ->
                    getCityDataByPlaceCode(placeCode)
                        .onErrorResume(error -> {
                            log.warn("장소 {} 조회 실패: {}", placeCode, error.getMessage());
                            return Mono.empty();
                        })
                )
                .doOnComplete(() ->
                    log.info("=== 커스텀 배치 조회 완료 ===")
                );
    }

    /**
     * 장소 코드로 API URI 생성
     *
     * @param placeCode 장소 코드
     * @return 완성된 API URI
     */
    private String buildUri(String placeCode) {
        // 형식: /{인증키}/{응답타입}/{서비스명}/1/5/{장소코드}
        return String.format("/%s/%s/%s/1/5/%s",
            properties.getKey(),
            properties.getResponseType(),
            properties.getServiceName(),
            placeCode
        );
    }

    /**
     * 장소명으로 API URI 생성
     *
     * @param placeName 장소명
     * @return 완성된 API URI
     */
    private String buildUriByPlaceName(String placeName) {
        // 장소명을 그대로 전달 (WebClient가 자동으로 URL 인코딩)
        return String.format("/%s/%s/%s/1/5/%s",
            properties.getKey(),
            properties.getResponseType(),
            properties.getServiceName(),
            placeName
        );
    }

    /**
     * 서울시 API 커스텀 예외
     */
    public static class SeoulApiException extends RuntimeException {
        private final int statusCode;

        public SeoulApiException(String message, int statusCode) {
            super(message);
            this.statusCode = statusCode;
        }

        public int getStatusCode() {
            return statusCode;
        }
    }
}
