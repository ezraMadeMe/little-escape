# God Mode Simulation API

## 개요

God Mode Simulation API는 '**Solotion**' 서비스의 추천 로직을 검증하기 위한 관리자 전용 테스트 도구입니다.

시간, 날씨, 혼잡도, 사용자 성향 등 **모든 환경 변수를 통제**하여 추천 알고리즘의 동작을 검증할 수 있습니다.

---

## API 엔드포인트

```
POST /api/admin/simulation
```

### Request Body

```json
{
  "targetDateTime": "2025-01-20T14:30:00",
  "latitude": 37.5665,
  "longitude": 126.9780,
  "searchRadius": 10,
  "weather": "SUNNY",
  "temperature": 15.5,
  "airQuality": "GOOD",
  "congestion": "LOW",
  "userMbti": "I",
  "soloLevel": 3,
  "forcedCategory": "FOOD"
}
```

### Request Parameters

| 파라미터 | 타입 | 필수 | 설명 | 예시 |
|---------|------|------|------|------|
| `targetDateTime` | LocalDateTime | ❌ | 가상의 현재 시간 (요일/시간대 체크용) | `2025-01-20T14:30:00` |
| `latitude` | Double | ✅ | 사용자 위도 | `37.5665` |
| `longitude` | Double | ✅ | 사용자 경도 | `126.9780` |
| `searchRadius` | Integer | ❌ | 탐색 반경 (km) | `10` (기본값) |
| `weather` | Enum | ❌ | 날씨 상태 | `SUNNY`, `RAIN`, `SNOW`, `CLOUDY` |
| `temperature` | Double | ❌ | 기온 (°C) | `15.5` |
| `airQuality` | Enum | ❌ | 공기 질 / 미세먼지 | `GOOD`, `BAD`, `WORST` |
| `congestion` | Enum | ❌ | 혼잡도 | `LOW`, `MEDIUM`, `HIGH` |
| `userMbti` | String | ❌ | 사용자 MBTI | `I` or `E` |
| `soloLevel` | Integer | ❌ | 솔로 레벨 (1~5) | `3` |
| `forcedCategory` | Enum | ❌ | 특정 카테고리 강제 지정 | `FOOD`, `ACTIVITY`, `RELAX`, `CULTURE` |

---

## Response

```json
{
  "mission": {
    "id": 1,
    "title": "혼밥 도전! 식당에서 맛있는 한 끼",
    "description": "처음 가보는 식당에서 나만의 시간을 즐겨보세요.",
    "category": "FOOD",
    "difficultyLevel": "MEDIUM",
    "condition": "혼자서 식사하기",
    "imageUrl": "/images/mission1.jpg",
    "locationType": "INDOOR",
    "timeOfDay": "AFTERNOON",
    "guide": "[...]"
  },
  "place": {
    "id": 42,
    "name": "서울숲 카페거리",
    "address": "서울특별시 성동구 성수동2가",
    "category": "RELAX",
    "latitude": 37.5447,
    "longitude": 127.0438,
    "imageUrl": "/images/place42.jpg",
    "tags": "QUIET,VIEW_POINT"
  },
  "debugLogs": [
    "🕒 시뮬레이션 시간: 2025-01-20T14:30:00 (MONDAY, 14시)",
    "📍 위치: (37.5665, 126.9780), 반경: 10km",
    "☁️ 날씨: SUNNY, 기온: 15.5°C, 미세먼지: GOOD",
    "👥 혼잡도: LOW, MBTI: I, 솔로레벨: 3",
    "⏰ 시간대: 오후 (AFTERNOON)",
    "☀️ 모든 장소 타입 가능",
    "🎯 카테고리 강제 지정: FOOD",
    "📋 조건에 맞는 미션 후보: 12개",
    "📅 월요일 - 도서관 미션 제외 (2개 제외됨)",
    "✅ 필터링 후 미션 후보: 10개",
    "✅ 선택된 미션: 혼밥 도전! 식당에서 맛있는 한 끼 (카테고리: FOOD, 난이도: MEDIUM)",
    "🏠 장소가 필요한 미션 - 장소 필터링 시작",
    "🗂️ 매칭 카테고리: [FOOD, RELAX]",
    "📍 반경 10km 내 필터링된 장소: 45개",
    "✅ 선택된 장소: 서울숲 카페거리 (카테고리: RELAX)"
  ],
  "totalMissionCandidates": 12,
  "filteredMissionCandidates": 10,
  "totalPlaceCandidates": 45,
  "filteredPlaceCandidates": 45
}
```

---

## 사용 사례

### 1️⃣ 월요일 도서관 필터링 검증

**시나리오**: 월요일에는 도서관이 휴무이므로 도서관 미션이 제외되어야 함

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-20T14:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "searchRadius": 10,
    "weather": "SUNNY",
    "temperature": 20.0,
    "airQuality": "GOOD",
    "congestion": "LOW",
    "userMbti": "I",
    "soloLevel": 3
  }'
```

**기대 결과**:
- `debugLogs`에서 "월요일 - 도서관 미션 제외" 로그 확인
- 도서관 관련 미션이 추천에서 제외됨

---

### 2️⃣ 비오는 날 실내 장소 추천 검증

**시나리오**: 비가 오면 실내 장소만 추천되어야 함

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T15:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "searchRadius": 10,
    "weather": "RAIN",
    "temperature": 12.0,
    "airQuality": "GOOD",
    "congestion": "MEDIUM",
    "userMbti": "E",
    "soloLevel": 4
  }'
```

**기대 결과**:
- `debugLogs`에서 "야외 활동 제한 - 실내 장소만 추천" 로그 확인
- 추천된 미션의 `locationType`이 `INDOOR` 또는 `ANY`

---

### 3️⃣ 야간 시간대 전시 제외 검증

**시나리오**: 밤 10시 이후에는 전시/공연 미션이 제외되어야 함

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T23:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "searchRadius": 10,
    "weather": "CLOUDY",
    "temperature": 8.0,
    "airQuality": "GOOD",
    "congestion": "LOW",
    "userMbti": "I",
    "soloLevel": 3
  }'
```

**기대 결과**:
- `debugLogs`에서 "밤 10시 이후 - 전시/공연 미션 제외" 로그 확인
- 전시/공연 관련 미션이 추천에서 제외됨

---

### 4️⃣ 혼잡도 높을 때 조용한 장소 우선순위 검증

**시나리오**: 혼잡도가 높으면 `QUIET` 태그가 있는 조용한 장소를 우선 추천

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T18:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "searchRadius": 10,
    "weather": "SUNNY",
    "temperature": 18.0,
    "airQuality": "GOOD",
    "congestion": "HIGH",
    "userMbti": "I",
    "soloLevel": 5
  }'
```

**기대 결과**:
- `debugLogs`에서 "혼잡도 높음 - 조용한 장소 우선" 로그 확인
- 추천된 장소의 `tags`에 `QUIET` 포함

---

### 5️⃣ 극한 기온 시 야외 활동 제한 검증

**시나리오**: 기온이 -5°C 미만 또는 30°C 초과 시 야외 활동 제한

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T14:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "searchRadius": 10,
    "weather": "SUNNY",
    "temperature": -8.0,
    "airQuality": "GOOD",
    "congestion": "LOW",
    "userMbti": "E",
    "soloLevel": 3
  }'
```

**기대 결과**:
- `debugLogs`에서 "야외 활동 제한 - 실내 장소만 추천 (극한기온)" 로그 확인
- 추천된 미션이 실내 활동만 포함

---

### 6️⃣ 솔로 레벨에 따른 난이도 필터링 검증

**시나리오**: 솔로 레벨이 낮으면 난이도 높은 미션(혼밥/혼술) 제외

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T12:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "searchRadius": 10,
    "weather": "SUNNY",
    "temperature": 20.0,
    "airQuality": "GOOD",
    "congestion": "LOW",
    "userMbti": "I",
    "soloLevel": 1
  }'
```

**기대 결과**:
- `debugLogs`에서 "솔로 레벨 1 - 난이도 높은 미션 제외" 로그 확인
- 추천된 미션의 `difficultyLevel`이 `HARD`가 아님

---

### 7️⃣ 특정 카테고리 강제 지정 검증

**시나리오**: 음식(FOOD) 카테고리만 강제로 추천

```bash
curl -X POST http://localhost:8080/api/admin/simulation \
  -H "Content-Type: application/json" \
  -d '{
    "targetDateTime": "2025-01-21T19:00:00",
    "latitude": 37.5665,
    "longitude": 126.9780,
    "searchRadius": 10,
    "weather": "SUNNY",
    "temperature": 15.0,
    "airQuality": "GOOD",
    "congestion": "LOW",
    "userMbti": "E",
    "soloLevel": 4,
    "forcedCategory": "FOOD"
  }'
```

**기대 결과**:
- `debugLogs`에서 "카테고리 강제 지정: FOOD" 로그 확인
- 추천된 미션의 `category`가 `FOOD`

---

## 아키텍처 설계

### 전략 패턴 적용

추천 로직을 **실제 서비스**와 **시뮬레이션**에서 공유하기 위해 `EnvironmentContext`를 중심으로 설계되었습니다.

```
┌──────────────────────────────────────────┐
│       EnvironmentContext                 │
│  (환경 변수 캡슐화)                       │
│                                          │
│  - targetDateTime: LocalDateTime         │
│  - weather: Weather                      │
│  - temperature: Double                   │
│  - airQuality: AirQuality                │
│  - congestion: Congestion                │
│  - userMbti: String                      │
│  - soloLevel: Integer                    │
│  - ...                                   │
└──────────────────────────────────────────┘
           ▲                    ▲
           │                    │
   ┌───────┴────────┐   ┌──────┴──────────┐
   │ Real-time Mode │   │ Simulation Mode │
   │ (실제 서비스)   │   │ (테스트)         │
   │                │   │                 │
   │ - 현재 시간    │   │ - 통제된 시간   │
   │ - 실제 날씨    │   │ - 가상 날씨     │
   │ - 실제 혼잡도  │   │ - 가상 혼잡도   │
   └────────────────┘   └─────────────────┘
```

### 주요 컴포넌트

1. **EnvironmentContext** (`service/simulation/EnvironmentContext.java`)
   - 모든 환경 변수를 캡슐화
   - `fromRealTime()`: 실제 서비스용 (현재 시간 기준)
   - `fromSimulation()`: 테스트용 (모든 변수 통제)

2. **SimulationService** (`service/SimulationService.java`)
   - 시뮬레이션 전용 로직
   - 필터링 로직을 AppointmentService와 공유 가능하도록 설계
   - 디버그 로그 수집 및 반환

3. **필터 로직**
   - `filterMissions()`: 미션 필터링 (시간대, 날씨, 난이도)
   - `filterPlaces()`: 장소 필터링 (거리, 카테고리, 혼잡도)
   - `applyTimeFilters()`: 시간대별 추가 필터링 (월요일 도서관 제외, 야간 전시 제외)
   - `applyDifficultyFilters()`: 솔로 레벨 기반 난이도 필터링

---

## 디버그 로그 예시

시뮬레이션 실행 시 `debugLogs` 배열에 다음과 같은 로그가 포함됩니다:

```json
[
  "🕒 시뮬레이션 시간: 2025-01-20T14:30:00 (MONDAY, 14시)",
  "📍 위치: (37.5665, 126.9780), 반경: 10km",
  "☁️ 날씨: RAIN, 기온: 12.0°C, 미세먼지: GOOD",
  "👥 혼잡도: MEDIUM, MBTI: E, 솔로레벨: 4",
  "⏰ 시간대: 오후 (AFTERNOON)",
  "🌧️ 야외 활동 제한 - 실내 장소만 추천 (비/눈/극한기온/미세먼지)",
  "📋 조건에 맞는 미션 후보: 8개",
  "📅 월요일 - 도서관 미션 제외 (1개 제외됨)",
  "✅ 필터링 후 미션 후보: 7개",
  "✅ 선택된 미션: 혼자만의 시간, 카페에서 책 읽기 (카테고리: RELAX, 난이도: EASY)",
  "🏠 장소가 필요한 미션 - 장소 필터링 시작",
  "🗂️ 매칭 카테고리: [RELAX, CULTURE]",
  "📍 반경 10km 내 필터링된 장소: 32개",
  "✅ 선택된 장소: 북촌 한옥마을 카페 (카테고리: RELAX)"
]
```

---

## 향후 확장 계획

1. **실제 날씨 API 연동**
   - 현재는 Mock 데이터 사용
   - 추후 OpenWeatherMap API 연동 예정

2. **실시간 혼잡도 API 연동**
   - 서울시 실시간 도시데이터 API 연동
   - 실시간 혼잡도 기반 추천

3. **공공 데이터 운영 기간 검증**
   - 도서관/전시/행사의 실제 운영 기간 체크
   - `Place` 테이블의 `startDate`, `endDate` 활용

4. **태그 기반 고급 필터링**
   - 사용자 태그 vs 미션/장소 태그 충돌 검증
   - 더 세밀한 추천 로직 구현

---

## 주의사항

⚠️ **이 API는 관리자 전용입니다.**

- 프로덕션 환경에서는 인증 필터를 추가해야 합니다.
- 현재는 테스트 목적으로 공개되어 있습니다.

⚠️ **데이터베이스 읽기 전용**

- 이 API는 데이터를 읽기만 하며, DB에 어떤 변경도 하지 않습니다.
- 안전하게 반복 테스트가 가능합니다.

---

## 라이선스

Copyright (c) 2025 Little Escape Team. All rights reserved.
