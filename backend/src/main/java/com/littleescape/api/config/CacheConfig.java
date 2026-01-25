package com.littleescape.api.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * 캐시 설정
 *
 * 도서 API 등 외부 API 호출 결과를 캐싱하여 성능 향상
 * Caffeine 캐시 사용 (인메모리)
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // 기본 캐시 설정: 1시간 유효, 최대 500개 항목
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(1, TimeUnit.HOURS)
                .maximumSize(500)
                .recordStats());

        // 캐시 이름 등록
        cacheManager.setCacheNames(java.util.List.of(
                "bookExistence",           // 도서 소장/대출 가능 여부
                "nearbyBookAvailability",  // 근처 대출 가능 도서관
                "bookDetail",              // 도서 상세 정보
                "bookKeywords"             // 도서 키워드
        ));

        return cacheManager;
    }
}
