package com.littleescape.api.controller;

import com.littleescape.api.domain.SeoulCityPlace;
import com.littleescape.api.dto.response.CongestionResponse;
import com.littleescape.api.repository.SeoulCityPlaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 서울시 실시간 혼잡도 조회 API 컨트롤러
 *
 * 프론트엔드에서 실시간 혼잡도를 조회할 수 있는 공개 API
 *
 * 주요 엔드포인트:
 * - GET /api/seoul/congestion/{placeCode} - 특정 장소 혼잡도 조회
 * - GET /api/seoul/congestion/nearby - 반경 내 장소 혼잡도 리스트
 * - GET /api/seoul/congestion/search - 장소명 검색 및 혼잡도 조회
 * - GET /api/seoul/congestion/all - 전체 장소 혼잡도 (관리자용)
 *
 * 특징:
 * - 인증 불필요 (공개 API)
 * - 캐싱된 서울시 도시데이터 사용
 * - 응답에 배지 색상 포함 (프론트엔드 UI용)
 */
@Slf4j
@RestController
@RequestMapping("/api/seoul")
@RequiredArgsConstructor
public class SeoulDataController {

    private final SeoulCityPlaceRepository seoulCityPlaceRepository;

    /**
     * 특정 장소의 현재 혼잡도 조회
     *
     * 예시:
     * GET /api/seoul/congestion/POI000001
     *
     * Response:
     * {
     *   "placeCode": "POI000001",
     *   "placeName": "광화문·덕수궁",
     *   "areaName": "종로구",
     *   "latitude": 37.5665,
     *   "longitude": 126.9780,
     *   "congestionLevel": 2,
     *   "congestionText": "보통",
     *   "badgeColor": "blue",
     *   "currentPopulation": 15000,
     *   "weatherCondition": "맑음",
     *   "temperature": 15.5,
     *   "lastUpdated": "2026-01-20T15:00:00",
     *   "isValid": true
     * }
     *
     * @param placeCode 장소 코드 (예: POI000001)
     * @return 혼잡도 정보
     */
    @GetMapping("/congestion/{placeCode}")
    public ResponseEntity<CongestionResponse> getCongestion(
            @PathVariable String placeCode
    ) {
        log.info("=== 혼잡도 조회 === 장소 코드: {}", placeCode);

        Optional<SeoulCityPlace> place = seoulCityPlaceRepository.findByPlaceCode(placeCode);

        if (place.isEmpty()) {
            log.warn("장소를 찾을 수 없음: {}", placeCode);
            return ResponseEntity.notFound().build();
        }

        SeoulCityPlace cityPlace = place.get();

        // 데이터가 유효하지 않으면 경고 로그
        if (!cityPlace.getIsValid()) {
            log.warn("유효하지 않은 데이터: {} (마지막 갱신: {})",
                    placeCode, cityPlace.getLastUpdated());
        }

        CongestionResponse response = CongestionResponse.from(cityPlace);
        log.info("→ 혼잡도: {} ({})", response.congestionLevel(), response.congestionText());

        return ResponseEntity.ok(response);
    }

    /**
     * 반경 내 모든 장소의 혼잡도 리스트
     *
     * 예시:
     * GET /api/seoul/congestion/nearby?lat=37.5665&lng=126.9780&radius=5
     *
     * Query Parameters:
     * - lat: 사용자 위도 (필수)
     * - lng: 사용자 경도 (필수)
     * - radius: 검색 반경 (km, 기본값: 5)
     *
     * Response: CongestionResponse 배열
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km, 기본값: 5)
     * @return 반경 내 장소 혼잡도 리스트 (거리순 정렬)
     */
    @GetMapping("/congestion/nearby")
    public ResponseEntity<List<CongestionResponse>> getNearbyPlacesCongestion(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "5") Integer radius
    ) {
        log.info("=== 근처 혼잡도 조회 === 위치: ({}, {}), 반경: {}km", lat, lng, radius);

        List<SeoulCityPlace> nearbyPlaces = seoulCityPlaceRepository
                .findPlacesWithinRadius(lat, lng, radius);

        log.info("→ 검색된 장소: {}개", nearbyPlaces.size());

        List<CongestionResponse> responses = nearbyPlaces.stream()
                .map(CongestionResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * 반경 내 혼잡도 낮은 장소만 필터링
     *
     * 예시:
     * GET /api/seoul/congestion/nearby/low?lat=37.5665&lng=126.9780&radius=5
     *
     * Query Parameters:
     * - lat: 사용자 위도 (필수)
     * - lng: 사용자 경도 (필수)
     * - radius: 검색 반경 (km, 기본값: 5)
     *
     * Response: 혼잡도 2(보통) 이하 장소만 반환
     *
     * @param latitude 사용자 위도
     * @param longitude 사용자 경도
     * @param radiusKm 검색 반경 (km, 기본값: 5)
     * @return 여유 있는 장소 리스트
     */
    @GetMapping("/congestion/nearby/low")
    public ResponseEntity<List<CongestionResponse>> getLowCongestionNearby(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(defaultValue = "5") Integer radius
    ) {
        log.info("=== 여유 있는 장소 조회 === 위치: ({}, {}), 반경: {}km", lat, lng, radius);

        List<SeoulCityPlace> lowCongestionPlaces = seoulCityPlaceRepository
                .findLowCongestionPlacesWithinRadius(lat, lng, radius);

        log.info("→ 여유 있는 장소: {}개", lowCongestionPlaces.size());

        List<CongestionResponse> responses = lowCongestionPlaces.stream()
                .map(CongestionResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * 장소명으로 검색 및 혼잡도 조회
     *
     * 예시:
     * GET /api/seoul/congestion/search?name=강남
     *
     * Query Parameters:
     * - name: 검색할 장소명 (부분 일치)
     *
     * Response: 이름에 포함된 모든 장소의 혼잡도
     *
     * @param placeName 검색할 장소명
     * @return 검색된 장소 혼잡도 리스트
     */
    @GetMapping("/congestion/search")
    public ResponseEntity<List<CongestionResponse>> searchPlacesCongestion(
            @RequestParam String name
    ) {
        log.info("=== 장소명 검색 === 검색어: {}", name);

        List<SeoulCityPlace> places = seoulCityPlaceRepository.searchByPlaceName(name);

        log.info("→ 검색 결과: {}개", places.size());

        if (places.isEmpty()) {
            log.info("검색 결과 없음: {}", name);
            return ResponseEntity.ok(List.of());
        }

        List<CongestionResponse> responses = places.stream()
                .map(CongestionResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * 전체 장소 혼잡도 조회
     *
     * 예시:
     * GET /api/seoul/congestion/all
     *
     * 주의: 관리자용 엔드포인트
     * 프로덕션에서는 @PreAuthorize 추가 권장
     *
     * @return 전체 장소 혼잡도 리스트
     */
    @GetMapping("/congestion/all")
    public ResponseEntity<List<CongestionResponse>> getAllPlacesCongestion() {
        log.info("=== 전체 혼잡도 조회 ===");

        List<SeoulCityPlace> allPlaces = seoulCityPlaceRepository.findByIsValidTrue();

        log.info("→ 유효한 장소: {}개", allPlaces.size());

        List<CongestionResponse> responses = allPlaces.stream()
                .map(CongestionResponse::from)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    /**
     * 혼잡도 통계 조회
     *
     * 예시:
     * GET /api/seoul/congestion/stats
     *
     * Response:
     * {
     *   "totalPlaces": 10,
     *   "smoothCount": 2,
     *   "normalCount": 3,
     *   "slightlyCrowdedCount": 2,
     *   "crowdedCount": 2,
     *   "veryCrowdedCount": 1,
     *   "averageCongestionLevel": 2.5
     * }
     *
     * @return 혼잡도 통계
     */
    @GetMapping("/congestion/stats")
    public ResponseEntity<CongestionStats> getCongestionStats() {
        log.info("=== 혼잡도 통계 조회 ===");

        long totalCount = seoulCityPlaceRepository.findByIsValidTrue().size();

        long smoothCount = seoulCityPlaceRepository.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.SMOOTH
        );

        long normalCount = seoulCityPlaceRepository.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.NORMAL
        );

        long slightlyCrowdedCount = seoulCityPlaceRepository.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.SLIGHTLY_CROWDED
        );

        long crowdedCount = seoulCityPlaceRepository.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.CROWDED
        );

        long veryCrowdedCount = seoulCityPlaceRepository.getPlaceCountByCongestionLevel(
                com.littleescape.api.domain.type.CongestionLevel.VERY_CROWDED
        );

        Double avgCongestion = seoulCityPlaceRepository.getAverageCongestionLevel();

        CongestionStats stats = new CongestionStats(
                totalCount,
                smoothCount,
                normalCount,
                slightlyCrowdedCount,
                crowdedCount,
                veryCrowdedCount,
                avgCongestion != null ? avgCongestion : 0.0
        );

        log.info("→ 통계: 전체 {}개, 평균 혼잡도 {}", totalCount, avgCongestion);

        return ResponseEntity.ok(stats);
    }

    /**
     * 혼잡도 통계 응답 DTO
     */
    public record CongestionStats(
            long totalPlaces,
            long smoothCount,
            long normalCount,
            long slightlyCrowdedCount,
            long crowdedCount,
            long veryCrowdedCount,
            double averageCongestionLevel
    ) {}
}
