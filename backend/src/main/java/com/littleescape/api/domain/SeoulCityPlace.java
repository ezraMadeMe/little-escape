package com.littleescape.api.domain;

import com.littleescape.api.domain.type.CongestionLevel;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 서울시 실시간 도시데이터 캐싱 엔티티
 *
 * 용도:
 * - 120개 주요 장소의 실시간 혼잡도/날씨 정보 캐싱
 * - 배치 스케줄러로 1시간마다 갱신
 * - MissionTemplate과 연결하여 실시간 추천에 활용
 *
 * 갱신 주기:
 * - 스케줄러: 매 시각 정각 (예: 10:00, 11:00, 12:00)
 * - 피크타임: 10분마다 (금/토 저녁 18:00~23:00)
 *
 * 데이터 출처:
 * - 서울시 실시간 도시데이터 API
 * - API 문서: https://data.seoul.go.kr/dataList/OA-21285/F/1/datasetView.do
 */
@Entity
@Table(
    name = "seoul_city_places",
    indexes = {
        @Index(name = "idx_place_code", columnList = "place_code"),
        @Index(name = "idx_congestion_level", columnList = "congestion_level"),
        @Index(name = "idx_last_updated", columnList = "last_updated")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class SeoulCityPlace extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ================================
    // 장소 기본 정보
    // ================================

    /**
     * 서울시 장소 코드 (POI ID)
     * 예: "POI001", "POI002"
     * API에서 제공하는 고유 코드
     */
    @Column(name = "place_code", nullable = false, unique = true, length = 50)
    private String placeCode;

    /**
     * 장소명
     * 예: "명동", "홍대입구역", "강남역"
     */
    @Column(name = "place_name", nullable = false, length = 200)
    private String placeName;

    /**
     * 지역 코드
     * 예: "강남구", "종로구", "마포구"
     */
    @Column(name = "area_code", length = 100)
    private String areaCode;

    /**
     * 지역명
     */
    @Column(name = "area_name", length = 200)
    private String areaName;

    // ================================
    // 위치 정보 (WGS84 좌표계)
    // ================================

    /**
     * 위도 (Y 좌표)
     */
    @Column(name = "latitude", nullable = false)
    private Double latitude;

    /**
     * 경도 (X 좌표)
     */
    @Column(name = "longitude", nullable = false)
    private Double longitude;

    // ================================
    // 실시간 혼잡도 정보
    // ================================

    /**
     * 혼잡도 레벨 (1~5)
     * - 1: 여유
     * - 2: 보통
     * - 3: 약간 붐빔
     * - 4: 붐빔
     * - 5: 매우 붐빔
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "congestion_level", nullable = false)
    private CongestionLevel congestionLevel = CongestionLevel.NORMAL;

    /**
     * 혼잡도 메시지
     * 예: "사람이 몰려있을 수 있지만 크게 붐비지는 않아요."
     */
    @Column(name = "congestion_message", columnDefinition = "TEXT")
    private String congestionMessage;

    /**
     * 현재 최소 인구수
     */
    @Column(name = "current_population_min")
    private Integer currentPopulationMin;

    /**
     * 현재 최대 인구수
     */
    @Column(name = "current_population_max")
    private Integer currentPopulationMax;

    // ================================
    // 날씨 정보
    // ================================

    /**
     * 날씨 상태
     * 예: "맑음", "흐림", "비", "눈"
     */
    @Column(name = "weather_condition", length = 50)
    private String weatherCondition;

    /**
     * 기온 (°C)
     */
    @Column(name = "temperature")
    private Double temperature;

    /**
     * 체감온도 (°C)
     */
    @Column(name = "sensible_temperature")
    private Double sensibleTemperature;

    /**
     * 강수량 (mm/h)
     */
    @Column(name = "rainfall")
    private Double rainfall;

    /**
     * 습도 (%)
     */
    @Column(name = "humidity")
    private Integer humidity;

    /**
     * 풍속 (m/s)
     */
    @Column(name = "wind_speed")
    private Double windSpeed;

    /**
     * 미세먼지 농도 (μg/m³)
     */
    @Column(name = "pm10")
    private Integer pm10;

    /**
     * 초미세먼지 농도 (μg/m³)
     */
    @Column(name = "pm25")
    private Integer pm25;

    // ================================
    // 인구 통계 정보
    // ================================

    /**
     * 남성 인구 비율 (%)
     */
    @Column(name = "male_population_rate")
    private Double malePopulationRate;

    /**
     * 여성 인구 비율 (%)
     */
    @Column(name = "female_population_rate")
    private Double femalePopulationRate;

    /**
     * 거주 인구 비율 (%)
     */
    @Column(name = "resident_population_rate")
    private Double residentPopulationRate;

    /**
     * 비거주 인구 비율 (%)
     */
    @Column(name = "non_resident_population_rate")
    private Double nonResidentPopulationRate;

    // ================================
    // 연령대별 인구 비율 (%)
    // ================================

    /**
     * 10대 인구 비율
     */
    @Column(name = "age_10s_rate")
    private Double age10sRate;

    /**
     * 20대 인구 비율
     */
    @Column(name = "age_20s_rate")
    private Double age20sRate;

    /**
     * 30대 인구 비율
     */
    @Column(name = "age_30s_rate")
    private Double age30sRate;

    /**
     * 40대 인구 비율
     */
    @Column(name = "age_40s_rate")
    private Double age40sRate;

    /**
     * 50대 인구 비율
     */
    @Column(name = "age_50s_rate")
    private Double age50sRate;

    /**
     * 60대 이상 인구 비율
     */
    @Column(name = "age_60s_plus_rate")
    private Double age60sPlusRate;

    // ================================
    // 메타데이터
    // ================================

    /**
     * 마지막 갱신 시간
     * API로부터 데이터를 가져온 시각
     */
    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    /**
     * API 응답 시간
     * API에서 제공한 데이터 측정 시각
     */
    @Column(name = "api_response_time")
    private LocalDateTime apiResponseTime;

    /**
     * 데이터 유효 여부
     * false인 경우 오래된 데이터이거나 API 호출 실패
     */
    @Column(name = "is_valid", nullable = false)
    private Boolean isValid = true;

    // ================================
    // 비즈니스 로직 메서드
    // ================================

    /**
     * 데이터가 최신인지 확인
     *
     * @param maxAgeMinutes 최대 허용 경과 시간 (분)
     * @return 최신 데이터 여부
     */
    public boolean isFresh(int maxAgeMinutes) {
        if (lastUpdated == null || !isValid) {
            return false;
        }
        return lastUpdated.isAfter(LocalDateTime.now().minusMinutes(maxAgeMinutes));
    }

    /**
     * 혼잡도가 허용 가능한 범위인지 확인
     *
     * @param maxLevel 최대 허용 혼잡도
     * @return 허용 가능 여부
     */
    public boolean isAcceptableCongestion(CongestionLevel maxLevel) {
        return congestionLevel.isAcceptable(maxLevel);
    }

    /**
     * 비가 오는지 확인
     *
     * @return 비 여부
     */
    public boolean isRainy() {
        return rainfall != null && rainfall > 0;
    }

    /**
     * 눈이 오는지 확인
     *
     * @return 눈 여부
     */
    public boolean isSnowy() {
        return weatherCondition != null &&
               (weatherCondition.contains("눈") || weatherCondition.contains("적설"));
    }

    /**
     * 맑은 날씨인지 확인
     *
     * @return 맑음 여부
     */
    public boolean isClearWeather() {
        return weatherCondition != null && weatherCondition.contains("맑음");
    }

    /**
     * 좋은 공기질인지 확인
     * PM2.5 기준: 15 이하 좋음, 35 이하 보통
     *
     * @return 좋은 공기질 여부
     */
    public boolean isGoodAirQuality() {
        if (pm25 == null) {
            return true; // 데이터 없으면 문제 없다고 가정
        }
        return pm25 <= 35; // 보통 이하
    }

    /**
     * 추천 가능한 장소인지 종합 판단
     * - 데이터 신선도: 60분 이내
     * - 혼잡도: 보통 이하
     * - 공기질: 보통 이하
     *
     * @return 추천 가능 여부
     */
    public boolean isRecommendable() {
        return isFresh(60)
            && isAcceptableCongestion(CongestionLevel.NORMAL)
            && isGoodAirQuality();
    }

    /**
     * 평균 인구수 계산
     *
     * @return 평균 인구수, 데이터 없으면 null
     */
    public Integer getAveragePopulation() {
        if (currentPopulationMin == null || currentPopulationMax == null) {
            return null;
        }
        return (currentPopulationMin + currentPopulationMax) / 2;
    }

    // ================================
    // 편의 메서드
    // ================================

    /**
     * 장소 정보 요약 문자열
     *
     * @return 장소 요약 (예: "명동 (보통, 15.2°C)")
     */
    public String getSummary() {
        return String.format("%s (%s, %.1f°C)",
            placeName,
            congestionLevel.getDescription(),
            temperature != null ? temperature : 0.0
        );
    }

    /**
     * 갱신 필요 여부 확인
     * 1시간 이상 지났거나 유효하지 않은 데이터
     *
     * @return 갱신 필요 여부
     */
    public boolean needsRefresh() {
        return !isFresh(60);
    }
}
