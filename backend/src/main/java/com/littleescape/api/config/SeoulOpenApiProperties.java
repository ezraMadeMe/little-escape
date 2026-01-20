package com.littleescape.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 서울시 실시간 도시데이터 API 설정
 *
 * API 문서: https://data.seoul.go.kr/dataList/OA-21285/F/1/datasetView.do
 *
 * 주요 기능:
 * - 실시간 인구 혼잡도 정보 (120개 주요 장소)
 * - 날씨 정보 (하늘 상태, 기온, 강수량)
 * - 위치 좌표 (WGS84)
 *
 * 제약사항:
 * - 한 번에 1개 장소만 조회 가능
 * - Rate Limiting 적용 필요
 */
@Component
@ConfigurationProperties(prefix = "seoul.openapi")
@Getter
@Setter
public class SeoulOpenApiProperties {
    /**
     * 서울시 Open API 인증키
     * application.yml에서 seoul.openapi.key 값으로 설정
     */
    private String key;

    /**
     * API Base URL (기본값 포함)
     * 형식: http://openapi.seoul.go.kr:8088/{인증키}/{요청파일타입}/{서비스명}/{장소코드}
     */
    private String baseUrl = "http://openapi.seoul.go.kr:8088";

    /**
     * 요청 파일 타입 (json 또는 xml)
     */
    private String responseType = "json";

    /**
     * 서비스명
     */
    private String serviceName = "citydata";

    /**
     * API 호출 타임아웃 (밀리초)
     * 기본값: 5000ms (5초)
     */
    private int timeoutMillis = 5000;

    /**
     * Rate Limiting을 위한 최소 호출 간격 (밀리초)
     * 기본값: 100ms (초당 최대 10회)
     */
    private long rateLimitDelayMillis = 100L;
}
