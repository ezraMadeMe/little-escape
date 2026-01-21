# God Mode Simulation API - Quick Start Guide

## 빠른 시작

God Mode Simulation API를 사용하여 추천 로직을 테스트하는 가장 빠른 방법입니다.

---

## 1. 서버 실행

```bash
cd backend
./gradlew bootRun
```

서버가 `http://localhost:8080`에서 실행됩니다.

---

## 2. 첫 번째 시뮬레이션 실행

### cURL 사용

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-20T14:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "weather": "SUNNY",
    "temperature": 20.0,
    "airQuality": "GOOD",
    "congestion": "LOW",
    "userMbti": "I",
    "soloLevel": 3
  }'
```

### Postman 사용

1. Method: `POST`
2. URL: `http://localhost:8080/api/admin/simulation`
3. Headers:
   ```
   Content-Type: application/json
   ```
4. Body (raw JSON):
   ```json
   {
     "targetDateTime": "2025-01-20T14:00:00",
     "latitude": 37.5665,
     "longitude": 126.9780,
     "weather": "SUNNY",
     "temperature": 20.0,
     "airQuality": "GOOD",
     "congestion": "LOW",
     "userMbti": "I",
     "soloLevel": 3
   }
   ```

---

## 3. 응답 확인

성공하면 다음과 같은 형태의 응답을 받습니다:

```json
{
  "mission": {
    "id": 1,
    "title": "혼밥 도전! 식당에서 맛있는 한 끼",
    "category": "FOOD",
    "difficultyLevel": "MEDIUM",
    ...
  },
  "place": {
    "id": 42,
    "name": "서울숲 카페거리",
    "address": "서울특별시 성동구 성수동2가",
    ...
  },
  "debugLogs": [
    "🕒 시뮬레이션 시간: 2025-01-20T14:00:00 (MONDAY, 14시)",
    "📍 위치: (37.5665, 126.9780), 반경: 10km",
    "☁️ 날씨: SUNNY, 기온: 20.0°C, 미세먼지: GOOD",
    ...
  ],
  "totalMissionCandidates": 12,
  "filteredMissionCandidates": 10
}
```

---

## 4. 주요 테스트 시나리오

### 🌧️ 비오는 날 테스트

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T15:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "weather": "RAIN",
    "temperature": 12.0,
    "airQuality": "GOOD",
    "congestion": "MEDIUM",
    "userMbti": "E",
    "soloLevel": 4
  }'
```

**기대 결과**: 실내 장소만 추천됨

---

### 📅 월요일 도서관 테스트

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-20T14:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "weather": "SUNNY",
    "temperature": 20.0,
    "airQuality": "GOOD",
    "congestion": "LOW",
    "userMbti": "I",
    "soloLevel": 3
  }'
```

**기대 결과**: 도서관 미션 제외됨 (월요일은 휴무)

---

### 🌙 야간 전시 테스트

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T23:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "weather": "CLOUDY",
    "temperature": 8.0,
    "airQuality": "GOOD",
    "congestion": "LOW",
    "userMbti": "I",
    "soloLevel": 3
  }'
```

**기대 결과**: 전시/공연 미션 제외됨 (밤 10시 이후)

---

### 🤫 혼잡도 높을 때 테스트

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T18:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "weather": "SUNNY",
    "temperature": 18.0,
    "airQuality": "GOOD",
    "congestion": "HIGH",
    "userMbti": "I",
    "soloLevel": 5
  }'
```

**기대 결과**: 조용한 장소 우선 추천

---

## 5. Swagger UI로 테스트

브라우저에서 다음 URL을 열어 Swagger UI로 테스트할 수 있습니다:

```
http://localhost:8080/swagger-ui/index.html
```

1. `Admin` 섹션 찾기
2. `POST /api/admin/simulation` 엔드포인트 클릭
3. `Try it out` 버튼 클릭
4. Request body 수정
5. `Execute` 버튼 클릭

---

## 6. 디버그 로그 읽는 법

응답의 `debugLogs` 배열에서 추천 과정을 상세히 확인할 수 있습니다:

```json
"debugLogs": [
  "🕒 시뮬레이션 시간: 2025-01-20T14:30:00 (MONDAY, 14시)",  // 시간 정보
  "📍 위치: (37.5665, 126.9780), 반경: 10km",                // 위치 정보
  "☁️ 날씨: RAIN, 기온: 12.0°C, 미세먼지: GOOD",             // 날씨 정보
  "👥 혼잡도: MEDIUM, MBTI: E, 솔로레벨: 4",                 // 사용자 정보
  "⏰ 시간대: 오후 (AFTERNOON)",                             // 시간대 분석
  "🌧️ 야외 활동 제한 - 실내 장소만 추천",                   // 날씨 필터링
  "📋 조건에 맞는 미션 후보: 8개",                          // 초기 후보
  "📅 월요일 - 도서관 미션 제외 (1개 제외됨)",              // 시간 필터링
  "✅ 필터링 후 미션 후보: 7개",                            // 필터링 결과
  "✅ 선택된 미션: 혼자만의 시간, 카페에서 책 읽기",         // 최종 선택
  "🏠 장소가 필요한 미션 - 장소 필터링 시작",               // 장소 검색
  "🗂️ 매칭 카테고리: [RELAX, CULTURE]",                    // 카테고리 매핑
  "📍 반경 10km 내 필터링된 장소: 32개",                    // 장소 후보
  "✅ 선택된 장소: 북촌 한옥마을 카페"                       // 최종 장소
]
```

---

## 7. 문제 해결

### 미션이 추천되지 않음

**원인**: 필터링 조건이 너무 엄격함

**해결**:
- `searchRadius`를 늘려보기 (예: 20km)
- `forcedCategory` 제거
- `soloLevel`을 높이기 (예: 5)

### 장소가 추천되지 않음

**원인**: 해당 지역에 장소 데이터가 부족함

**해결**:
- 다른 위치(서울 중심부)로 테스트
  ```json
  "latitude": 37.5665,
  "longitude": 126.9780
  ```
- `searchRadius`를 늘리기

### 서버 연결 오류

**원인**: 서버가 실행되지 않음

**해결**:
```bash
cd backend
./gradlew bootRun
```

---

## 8. 더 알아보기

전체 문서는 [GOD_MODE_SIMULATION_API.md](./GOD_MODE_SIMULATION_API.md)를 참고하세요.

- 전체 파라미터 설명
- 아키텍처 설계
- 고급 사용 사례
- 향후 확장 계획

---

## 9. 피드백

문제가 발생하거나 개선 사항이 있으면 이슈를 남겨주세요!

Copyright (c) 2025 Little Escape Team. All rights reserved.
