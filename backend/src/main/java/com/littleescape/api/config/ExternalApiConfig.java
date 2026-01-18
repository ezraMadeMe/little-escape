package com.littleescape.api.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeFilterFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * 외부 공공 API 연동을 위한 WebClient 설정
 * - KOPIS (공연예술통합전산망)
 * - Seoul Open Data (서울시 열린데이터)
 * - Data4Library (도서관정보나루)
 */
@Slf4j
@Configuration
public class ExternalApiConfig {

    @Value("${external-api.kopis.base-url:http://www.kopis.or.kr/openApi/restful}")
    private String kopisBaseUrl;

    @Value("${external-api.seoul.base-url:http://openapi.seoul.go.kr:8088}")
    private String seoulBaseUrl;

    @Value("${external-api.library.base-url:http://data4library.kr/api}")
    private String libraryBaseUrl;

    @Value("${external-api.kakao.base-url:https://dapi.kakao.com}")
    private String kakaoBaseUrl;

    /**
     * KOPIS API용 WebClient
     * 공연/전시 정보 조회
     */
    @Bean(name = "kopisWebClient")
    public WebClient kopisWebClient() {
        return WebClient.builder()
                .baseUrl(kopisBaseUrl)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_XML_VALUE)
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    /**
     * Seoul Open Data API용 WebClient
     * 문화행사 정보 조회
     */
    @Bean(name = "seoulWebClient")
    public WebClient seoulWebClient() {
        return WebClient.builder()
                .baseUrl(seoulBaseUrl)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    /**
     * Data4Library API용 WebClient
     * 도서관 및 도서 정보 조회
     */
    @Bean(name = "libraryWebClient")
    public WebClient libraryWebClient() {
        return WebClient.builder()
                .baseUrl(libraryBaseUrl)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_XML_VALUE)
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    /**
     * Kakao Local API용 WebClient
     * 주소 → 좌표 변환 (Geocoding)
     */
    @Bean(name = "kakaoWebClient")
    public WebClient kakaoWebClient(@Value("${external-api.kakao.rest-api-key}") String kakaoApiKey) {
        return WebClient.builder()
                .baseUrl(kakaoBaseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "KakaoAK " + kakaoApiKey)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .clientConnector(new ReactorClientHttpConnector(createHttpClient()))
                .filter(logRequest())
                .filter(logResponse())
                .build();
    }

    /**
     * HTTP Client 설정
     * - Connection Timeout: 5초
     * - Response Timeout: 5초
     * - Read Timeout: 5초
     * - Write Timeout: 5초
     * 
     * 공공 API 호출 시 서버가 멈추지 않도록 짧은 타임아웃 설정
     */
    private HttpClient createHttpClient() {
        return HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
                .responseTimeout(Duration.ofSeconds(5))
                .doOnConnected(conn ->
                        conn.addHandlerLast(new ReadTimeoutHandler(5, TimeUnit.SECONDS))
                                .addHandlerLast(new WriteTimeoutHandler(5, TimeUnit.SECONDS))
                );
    }

    /**
     * Request Logging Filter
     */
    private ExchangeFilterFunction logRequest() {
        return ExchangeFilterFunction.ofRequestProcessor(clientRequest -> {
            log.info("=== External API Request ===");
            log.info("Method: {}", clientRequest.method());
            log.info("URL: {}", clientRequest.url());
            log.info("Headers: {}", clientRequest.headers());
            return Mono.just(clientRequest);
        });
    }

    /**
     * Response Logging Filter
     */
    private ExchangeFilterFunction logResponse() {
        return ExchangeFilterFunction.ofResponseProcessor(clientResponse -> {
            log.info("=== External API Response ===");
            log.info("Status Code: {}", clientResponse.statusCode());
            return Mono.just(clientResponse);
        });
    }
}

