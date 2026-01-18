package com.littleescape.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataImportService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * 서울 맛집 데이터 import
     */
    @Transactional
    public int importSeoulRestaurants() {
        log.info("=== 서울 맛집 데이터 import 시작 ===");

        try {
            // SQL 파일 읽기
            ClassPathResource resource = new ClassPathResource("db/data/insert_seoul_restaurants.sql");
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)
            );

            List<String> statements = new ArrayList<>();
            StringBuilder currentStatement = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                // 주석 및 빈 줄 스킵
                if (line.trim().startsWith("--") || line.trim().isEmpty()) {
                    continue;
                }

                currentStatement.append(line).append(" ");

                // 세미콜론으로 끝나면 하나의 statement로 인식
                if (line.trim().endsWith(";")) {
                    statements.add(currentStatement.toString().trim());
                    currentStatement = new StringBuilder();
                }
            }

            reader.close();

            log.info("총 {}개의 SQL statement 파싱 완료", statements.size());

            // SQL 실행
            int successCount = 0;
            int failCount = 0;

            for (String statement : statements) {
                try {
                    jdbcTemplate.execute(statement);
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                    log.warn("SQL 실행 실패: {}", e.getMessage());
                }
            }

            log.info("=== 서울 맛집 데이터 import 완료 ===");
            log.info("성공: {}개, 실패: {}개", successCount, failCount);

            return successCount;
        } catch (Exception e) {
            log.error("서울 맛집 데이터 import 중 오류 발생", e);
            throw new RuntimeException("데이터 import 실패: " + e.getMessage(), e);
        }
    }

    /**
     * Places 테이블의 모든 데이터 삭제 (개발용)
     */
    @Transactional
    public void clearAllPlaces() {
        log.warn("⚠️ Places 테이블의 모든 데이터 삭제 시작");
        jdbcTemplate.execute("DELETE FROM places");
        log.warn("⚠️ Places 테이블의 모든 데이터 삭제 완료");
    }

    /**
     * Places 테이블의 데이터 개수 조회
     */
    public long countPlaces() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM places", Long.class);
        return count != null ? count : 0;
    }
}
