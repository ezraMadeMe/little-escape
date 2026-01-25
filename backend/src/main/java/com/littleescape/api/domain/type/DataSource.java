package com.littleescape.api.domain.type;

/**
 * 데이터 수집 출처를 구분하는 Enum
 * 외부 API에서 수집된 데이터의 원본 소스를 추적하기 위해 사용
 */
public enum DataSource {
    KOPIS,              // 공연예술통합전산망 (공연/축제)
    SEOUL_CULTURE,      // 서울시 문화행사 정보
    SEOUL_PARK,         // 서울시 공원현황
    SEOUL_RESERVATION,  // 서울시 공공서비스예약 문화행사
    SEOUL_RESTAURANT,   // 서울시 모범음식점
    LIBRARY,            // 도서관정보나루
    MANUAL              // 수동 등록
}
