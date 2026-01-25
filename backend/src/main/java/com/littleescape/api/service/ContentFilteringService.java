package com.littleescape.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 콘텐츠 필터링 서비스
 * 2030 1인 가구 타겟에 맞지 않는 데이터를 필터링
 *
 * 주요 기능:
 * - 제외 키워드 필터링 (아동, 가족, 교육 등)
 * - 가격 필터링 (7만원 초과 제외)
 * - 가격 텍스트 파싱
 */
@Slf4j
@Service
public class ContentFilteringService {

    /**
     * 제외 키워드 목록 (2030 1인가구 타겟과 맞지 않음)
     */
    private static final List<String> EXCLUDE_KEYWORDS = List.of(
            // 아동/어린이 관련
            "아동", "어린이", "유아", "키즈", "kids", "baby", "영유아",
            "초등", "초등학생", "중등", "중학생", "유치원",
            // 가족 관련
            "가족", "패밀리", "family", "부모", "엄마", "아빠", "맘", "대디",
            // 교육 관련
            "교육", "체험학습", "방학", "학습", "수업", "강좌",
            // 기타
            "노인", "실버", "경로"
    );

    /**
     * 최대 허용 가격 (원)
     * application.yml에서 설정 가능
     */
    @Value("${data-ingestion.filtering.max-ticket-price:70000}")
    private int maxTicketPrice;

    /**
     * 가격 파싱용 정규식
     * "50,000원", "50000원", "50,000" 등 매칭
     */
    private static final Pattern PRICE_PATTERN = Pattern.compile("([0-9,]+)\\s*원?");

    /**
     * 제목/설명에 제외 키워드 포함 여부 확인
     *
     * @param texts 검사할 텍스트들 (title, description, place 등)
     * @return 제외해야 하면 true
     */
    public boolean shouldExclude(String... texts) {
        String combined = String.join(" ", texts != null ? texts : new String[0]).toLowerCase();

        if (combined.isEmpty()) {
            return false;
        }

        for (String keyword : EXCLUDE_KEYWORDS) {
            if (combined.contains(keyword.toLowerCase())) {
                log.debug("제외 키워드 발견: '{}' in '{}'", keyword,
                        combined.length() > 50 ? combined.substring(0, 50) + "..." : combined);
                return true;
            }
        }
        return false;
    }

    /**
     * 가격이 허용 범위 내인지 확인
     *
     * @param price 티켓 가격 (원)
     * @return 허용 가능하면 true, 초과하면 false
     */
    public boolean isPriceAcceptable(Integer price) {
        if (price == null) {
            return true; // 가격 정보 없으면 허용
        }
        return price <= maxTicketPrice;
    }

    /**
     * 무료 여부 확인
     *
     * @param feeText 요금 텍스트
     * @return 무료이면 true
     */
    public boolean isFree(String feeText) {
        if (feeText == null || feeText.isEmpty()) {
            return false;
        }
        String lower = feeText.toLowerCase().trim();
        return lower.contains("무료") ||
               lower.equals("0") ||
               lower.equals("0원") ||
               lower.contains("free") ||
               lower.equals("");
    }

    /**
     * 가격 텍스트에서 최저가 추출
     *
     * 예시:
     * - "R석 70,000원, S석 50,000원" → 50000
     * - "전석 50,000원" → 50000
     * - "무료" → 0
     * - "20,000원~50,000원" → 20000
     *
     * @param priceText 가격 텍스트
     * @return 최저가 (원), 파싱 실패 시 null
     */
    public Integer parseMinPrice(String priceText) {
        if (priceText == null || priceText.isEmpty()) {
            return null;
        }

        // 무료인 경우
        if (isFree(priceText)) {
            return 0;
        }

        // "프로그램별 상이" 등 불확실한 경우
        if (priceText.contains("상이") || priceText.contains("문의") || priceText.contains("미정")) {
            return null;
        }

        Matcher matcher = PRICE_PATTERN.matcher(priceText);
        int minPrice = Integer.MAX_VALUE;
        boolean found = false;

        while (matcher.find()) {
            try {
                String priceStr = matcher.group(1).replaceAll(",", "").trim();
                int price = Integer.parseInt(priceStr);
                minPrice = Math.min(minPrice, price);
                found = true;
            } catch (NumberFormatException e) {
                log.debug("가격 파싱 실패: {}", matcher.group(1));
            }
        }

        if (!found) {
            log.debug("가격 정보 없음: {}", priceText);
            return null;
        }

        log.debug("가격 파싱: '{}' → {}원", priceText, minPrice);
        return minPrice;
    }

    /**
     * 가격 텍스트에서 최고가 추출
     *
     * @param priceText 가격 텍스트
     * @return 최고가 (원), 파싱 실패 시 null
     */
    public Integer parseMaxPrice(String priceText) {
        if (priceText == null || priceText.isEmpty() || isFree(priceText)) {
            return parseMinPrice(priceText);
        }

        Matcher matcher = PRICE_PATTERN.matcher(priceText);
        int maxPrice = 0;
        boolean found = false;

        while (matcher.find()) {
            try {
                String priceStr = matcher.group(1).replaceAll(",", "").trim();
                int price = Integer.parseInt(priceStr);
                maxPrice = Math.max(maxPrice, price);
                found = true;
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        return found ? maxPrice : null;
    }

    /**
     * 아동 관람 가능 여부 확인 (KOPIS kidstate)
     *
     * @param kidState KOPIS API의 kidstate 값
     * @return 아동 관람 가능하면 true (우리 서비스에서는 제외 대상)
     */
    public boolean isKidsAllowed(String kidState) {
        return "Y".equalsIgnoreCase(kidState);
    }

    /**
     * 공연 상태가 활성인지 확인 (KOPIS prfstate)
     *
     * @param state 공연 상태
     * @return 활성(공연중/공연예정)이면 true
     */
    public boolean isPerformanceActive(String state) {
        if (state == null) {
            return false;
        }
        return state.contains("공연중") || state.contains("공연예정");
    }

    /**
     * 서울시 문화행사 코드명 필터링
     * 교육/체험 카테고리 제외
     *
     * @param codeName 분류명
     * @return 제외해야 하면 true
     */
    public boolean shouldExcludeByCodeName(String codeName) {
        if (codeName == null) {
            return false;
        }
        String lower = codeName.toLowerCase();
        return lower.contains("교육") || lower.contains("체험");
    }

    /**
     * 종합 필터링: 제목, 장소, 설명, 가격 모두 확인
     *
     * @param title 제목
     * @param place 장소
     * @param description 설명
     * @param priceText 가격 텍스트
     * @return 제외해야 하면 true
     */
    public boolean shouldExcludeComprehensive(String title, String place,
                                               String description, String priceText) {
        // 1. 키워드 필터링
        if (shouldExclude(title, place, description)) {
            return true;
        }

        // 2. 가격 필터링
        Integer price = parseMinPrice(priceText);
        if (price != null && !isPriceAcceptable(price)) {
            log.debug("가격 초과로 제외: {} ({}원 > {}원)", title, price, maxTicketPrice);
            return true;
        }

        return false;
    }

    /**
     * 제외 키워드 목록 반환 (디버깅/로깅용)
     */
    public List<String> getExcludeKeywords() {
        return EXCLUDE_KEYWORDS;
    }

    /**
     * 최대 허용 가격 반환 (디버깅용)
     */
    public int getMaxTicketPrice() {
        return maxTicketPrice;
    }
}
