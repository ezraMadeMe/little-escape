package com.littleescape.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Spring Scheduler 활성화 설정
 * 
 * @Scheduled 어노테이션이 동작하려면 이 설정이 필요함
 * - 데이터 수집 스케줄러 (DataIngestionService)
 * - 기타 정기 작업들
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {
    // Spring Boot가 자동으로 스케줄러를 활성화함
}









