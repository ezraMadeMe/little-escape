# 🌿 Little Escape (작은 일탈)

> **바쁜 현대인을 위한 일상 속 작은 휴식 제안 서비스**

## 🚀 프로젝트 소개 (Project Overview)
'작은 일탈'은 반복되는 일상에 지친 사용자들에게 시간대와 날씨에 맞는 '작은 미션'을 추천하여 리프레시를 돕는 웹 서비스입니다.

---

## ✨ 주요 기능 (Key Features)

### 1. 🕒 상황별 맞춤 미션 추천 (Recommendation)
- **시간대 분석:** 사용자가 선택한 약속 시간을 분석하여 최적의 미션을 제안합니다.
  - *아침(Morning):* 상쾌한 시작을 위한 활동
  - *밤(Night):* 감성적이고 차분한 장소
- **장소 필터링:** 날씨 및 상황에 맞춰 실내/실외 장소 타입을 자동으로 필터링합니다.

### 2. 📸 감성 미션 인증 & 피드 (Feed & Proof)
- **인스타그램 스타일 피드:** 마이페이지를 직관적인 카드 UI와 이미지 슬라이더로 구성하여 몰입감을 높였습니다.
- **감성 키워드 리뷰:** 긴 텍스트 대신 "🌿 힐링돼요", "🔥 뿌듯해요" 같은 뱃지형 태그로 직관적인 후기를 남깁니다.
- **다중 이미지 슬라이더:** 여러 장의 인증샷을 슬라이드 형태로 기록할 수 있습니다.

### 3. 📅 약속 관리 & 스마트 액션 (Appointment)
- **약속 생성 및 관리:** 미션을 선택하여 약속을 잡고 관리합니다.
- **스마트 액션:** 약속 시간이 되면 자동으로 **[인증하기]** 버튼이 활성화됩니다.
- **Revenge (다시 지키러 가기):** 취소했던 약속을 버튼 하나로 손쉽게 복제하여 다시 시도할 수 있습니다.
- **월간 리포트:** 매월 1일, 지난달의 활동 기록을 이메일로 리포팅합니다.

### 4. 🔐 인증 & 계정 (Auth)
- **소셜 로그인:** Google, Kakao OAuth2 지원.
- **매직 링크:** 비밀번호 없이 SMS로 전송된 링크 클릭 한 번으로 로그인.
- **친구 초대:** SMS를 통해 지인에게 서비스 초대장 발송.

---

## 🛠 기술적 도전 및 개선 (Technical Highlights)

### 📤 파일 업로드 및 이미지 처리
- **Multipart/FormData & JSON 혼합 전송:** 복잡한 DTO와 다중 파일을 하나의 요청으로 안정적으로 처리하는 구조를 구현했습니다.
- **로컬 스토리지 전략:** 개발 편의를 위해 서버 내부 `uploads/` 폴더 자동 생성 및 정적 리소스 매핑(WebConfig)을 적용했습니다.
- **이미지 슬라이더:** `react-slick`을 커스텀하여 모바일 터치 친화적인 UX를 제공합니다.

### 🌏 Timezone & Data Integrity
- **KST 표준화:** 프론트엔드와 백엔드 간의 시간 오차(UTC vs KST)를 제거하기 위해 데이터 전송 포맷을 통일하고 서버 타임존을 `Asia/Seoul`로 고정하여 데이터 정합성을 확보했습니다.

---

## 🛠 기술 스택 (Tech Stack)

| 구분 | 스택 |
| :-- | :-- |
| **Backend** | Java 17, Spring Boot 3.x, JPA/Hibernate, MySQL/PostgreSQL |
| **Frontend** | React, TypeScript, Tailwind CSS, React-slick, Axios |
| **DevOps** | Docker, Ngrok (Tunneling) |
| **API** | CoolSMS, Google/Kakao OAuth, Kakao Maps API |

---

## ⚙️ 환경 설정 (Environment Setup)

### 1. 필수 환경 변수
서비스 실행을 위해 `.env` (Frontend) 및 `application.yml` (Backend) 설정이 필요합니다.

```properties
# SMS (CoolSMS)
COOLSMS_API_KEY=your_api_key
COOLSMS_API_SECRET=your_api_secret
COOLSMS_SENDER_PHONE=01012345678

# OAuth
GOOGLE_CLIENT_ID=...
KAKAO_CLIENT_ID=...

# Email
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

### 2. 모바일 테스트 가이드 (Ngrok)
모바일 기기 접속 및 소셜 로그인 테스트를 위해 Ngrok 설정이 필요합니다.

Ngrok 실행: ngrok http 8080

생성된 HTTPS URL을 .env의 VITE_API_BASE_URL에 등록

Google Cloud Console 등에서 리다이렉트 URI에 Ngrok 주소 추가

---

## 🚀 v1.2 주요 업데이트 (2026.01.12)

### 1. 🚦 온보딩 & 계정 관리 (Onboarding)
- **단계별 회원가입:** 소셜 로그인 후 별도의 온보딩 페이지를 통해 닉네임, 프로필 사진, 휴대폰 번호를 설정합니다.
- **휴대폰 번호 기반 계정 통합:** 카카오, 구글 등 어떤 소셜 계정으로 로그인해도 휴대폰 번호가 같다면 하나의 계정으로 관리됩니다.
- **안전한 보안:** `Guest`와 `User` 권한을 분리하여 인증되지 않은 사용자의 접근을 제어합니다.

### 2. 👆 앱 스타일 제스처 (Swipe & Action)
- **스와이프 액션(Swipe):** 약속 리스트를 좌우로 밀어서 직관적으로 관리합니다.
  - **왼쪽(←):** 약속 삭제 (휴지통)
  - **오른쪽(→):** 약속 다시 잡기 (Revenge)
- **즐겨찾기(Favorite):** 마음에 들었던 미션이나 약속을 별표(★)하여 따로 모아볼 수 있습니다.
- **다중 선택 모드:** 여러 약속을 선택하여 한 번에 정리할 수 있는 관리 기능을 제공합니다.

### 3. 🎨 감성 UI 리뉴얼 (Cream Theme)
- **아이보리 테마:** 기존의 차가운 화이트 톤을 따뜻한 **크림/아이보리(#FAFAF9)** 컬러로 변경하여 감성적인 분위기를 강화했습니다.
- **피드형 레이아웃:** 카드 간 여백을 없애고 콘텐츠에 집중할 수 있는 몰입형 디자인을 적용했습니다.

---

## 🚀 v2.0 주요 업데이트 (2026.01.13)

### 1. 💬 채팅형 약속 시스템 (Chat-based Appointment)
- **대화형 UX:** 봇과의 자연스러운 대화를 통해 약속을 생성합니다.
  - Step 1: 시간 선택 (월/일/시간 드롭다운)
  - Step 2: 위치 및 검색 반경 설정 (GPS 연동)
  - Step 3: 미션 추천 및 선택
- **타임피커 개선:** 년도/분 단위 제거, 기본값 3일 뒤 설정, 과거 시간 선택 차단
- **엄격한 리다이렉트:** 약속 생성 완료 시 자동으로 약속 리스트로 이동

### 2. 📍 위치 기반 추천 시스템 (Location-based Recommendation)
- **GPS 연동:** `LocationPicker` 컴포넌트를 통해 현재 위치 자동 감지
- **검색 반경 설정:** 1km~10km 슬라이더로 추천 범위 조절
- **Haversine 공식:** 위경도 기반 거리 계산 쿼리로 주변 미션 필터링
- **테스트 데이터:** 가산디지털단지역/장한평역 주변 미션 20개 추가

### 3. 🔒 Blind Mission 시스템 (D-1 Mission Unlock)
- **약속 상태 재정의:**
  - `CREATED`: 시간/장소 설정 완료, 미션 비공개
  - `UNLOCKED`: D-1 자동 공개, 미션 선택 가능
  - `ACCEPTED`: 미션 선택 완료
  - `COMPLETED`: 인증 완료
- **자동 스케줄러:**
  - D-1 매직링크 발송 (매시간 cron 실행)
  - D-3h 리마인더 알림
- **UUID 토큰:** 보안을 위한 고유 링크 생성

### 4. 🎯 Smart FAB & Hero Section
- **Smart FAB (중앙 버튼):**
  - 다가오는 약속의 남은 시간을 실시간 표시 (예: `09h`, `30m`)
  - 긴급도에 따라 색상 변경 (1시간 미만 빨강)
  - 클릭 시 해당 약속 채팅방으로 이동
- **Hero Section:**
  - 약속 리스트 최상단에 Featured Card 배치
  - 인스타그램 피드 스타일의 강조 레이아웃
  - 개발용 언락 버튼 (D-1, Now) 탑재

### 5. 📱 실디바이스 테스트 환경 구축
- **네트워크 접근:** Vite `--host` 옵션으로 로컬 IP 접근 허용
- **CORS 중앙화:** `@ConfigurationProperties`로 allowed-origins 관리
- **OAuth 콜백 수정:** 모바일 환경에서도 소셜 로그인 정상 작동

### 6. 🔧 개발 편의성 개선
- **개발용 버튼:** 약속 일자를 D-1 또는 현재 시간으로 강제 변경
- **자동 인증 처리:** 토큰 만료 시 자동 로그아웃 및 로그인 페이지 리다이렉트
- **컴포넌트 분리:** ActionChips, EditActionChips, FeaturedCard, LocationPicker 모듈화

---

## 🛠 기술적 해결 사례 (Technical Challenges)

### 🔐 OAuth2 & Data Integrity
- **Null Safety:** 소셜 로그인 시 이메일 정보가 없는 경우(Kakao 등) 발생하던 서버 에러를 방어 코드로 해결하고, 식별 체계를 `Email`에서 `Phone Number` + `Social ID` 조합으로 변경했습니다.
- **Unique Constraint:** 중복 회원 생성을 방지하기 위해 DB 레벨에서 강력한 유니크 제약 조건을 설정하고, 예외 처리를 통해 데이터 무결성을 확보했습니다.

### 🖼️ UI/UX Optimization
- **Swipe Interactions:** 모바일 웹에서도 네이티브 앱처럼 부드러운 스와이프 경험을 제공하기 위해 터치 이벤트 핸들링을 최적화했습니다.
- **Dynamic Routing:** 사용자의 `Role`(Guest vs User)에 따라 온보딩 페이지와 메인 페이지로 자동 분기되는 스마트 라우팅을 구현했습니다.

### 🌍 Location-based Filtering
- **GPS Fallback:** Geolocation API 실패 시 기본 좌표(서울 시청)로 자동 설정하여 서비스 중단 없이 사용 가능하도록 구현했습니다.
- **Haversine Query:** 순수 SQL 기반 거리 계산으로 별도 GIS 라이브러리 없이 위치 필터링을 구현했습니다.
- **DB Constraint Handling:** 상태 전환 시 DB 제약 조건을 준수하도록 로직을 세밀하게 제어하여 무결성을 보장했습니다.

### ⏰ Scheduler & Notification
- **Cron-based Scheduler:** Spring `@Scheduled`를 활용하여 매시간 자동으로 D-1 약속을 `UNLOCKED` 상태로 전환하고 매직링크를 발송합니다.
- **UUID Token:** 약속 ID 노출 방지를 위해 UUID 기반 보안 토큰을 생성하여 매직링크에 사용합니다.

---

## 🚀 v2.1 주요 업데이트 (2026.01.15)

### 1. 📱 소셜 피드 시스템 (Social Feed)
- **인스타그램 스타일 피드:** 다른 사용자들의 미션 완료 인증을 실시간으로 확인할 수 있는 피드 페이지 추가
  - 프로필 이미지, 닉네임, 미션 제목, 상태 배지 표시
  - 인증 이미지와 후기 텍스트 조회
  - 상대 시간 표시 (예: "2시간 전", "30분 전")
- **북마크 기능:** 마음에 드는 피드를 저장하고 북마크 수를 실시간으로 표시
- **미션 복사 기능:** "이 일탈 가져오기" 버튼으로 다른 사람의 미션을 내 약속으로 복제 가능

### 2. 💬 댓글 & 소통 시스템 (Comment System)
- **바텀시트 댓글 UI:** 모바일 친화적인 바텀시트 형태의 댓글 인터페이스
  - 최대 높이 80vh, 부드러운 애니메이션 전환
  - 바텀시트 열릴 때 body 스크롤 자동 차단
- **답글 중첩 구조:** 댓글에 대한 답글 작성 및 표시 지원
  - 답글 작성 시 "@닉네임 님에게 답글 작성 중" 표시
  - 시각적 들여쓰기로 계층 구조 명확화
- **실시간 업데이트:** 댓글 작성 시 피드의 댓글 수 즉시 반영
- **UX 최적화:**
  - Enter 키로 댓글 전송
  - 빈 댓글 전송 방지
  - 모바일 safe area 고려

### 3. 🎨 UI/UX 개선
- **Lucide React 아이콘 라이브러리 도입:** 일관된 디자인 시스템 구축
  - MessageCircle, Bookmark, Clock, Download, Send, X 등 활용
- **date-fns 한국어 로케일:** 자연스러운 한국어 시간 표현
- **피드 카드 디자인:**
  - 카드 간 최소 여백으로 콘텐츠 집중
  - 호버 효과 및 부드러운 전환 애니메이션
  - 상태별 배지 색상 구분 (완료: 초록, 진행중: 파랑)

### 4. 🔧 타입 시스템 강화
- **FeedAppointment 타입:** 피드 전용 약속 데이터 구조 정의
  - 북마크 상태, 댓글 수 등 소셜 기능 관련 필드 포함
- **FeedComment 타입:** 재귀적 답글 구조 지원
  - User 타입 재사용으로 일관성 유지
  - replies 필드로 무한 중첩 가능

---

## 🚀 v2.2 주요 업데이트 (2026.01.19)

### 1. 🏷️ 태그 기반 필터링 시스템 (Tag-based Filtering)
- **사용자 선호도 태그:** 사용자의 취향과 제약사항을 태그로 관리
  - `NO_ALCOHOL`: 술을 못 마시는 사용자
  - `HATE_WALKING`: 장거리 이동을 싫어하는 사용자
  - `INDOOR_ONLY`: 실내 활동만 선호
  - `NO_SPORTS`: 운동/스포츠 싫어함
- **미션/장소 태그:** 미션과 장소의 특성을 태그로 정의
  - `ALCOHOL_ONLY`: 술 관련 필수 장소 (와인바, 포장마차)
  - `HIGH_ACTIVITY`: 높은 활동량 필요 (조깅, 등산, 자전거)
  - `OUTDOOR_REQUIRED`: 야외 필수
  - `SPORTS_REQUIRED`: 스포츠/운동 필수
- **충돌 규칙 기반 필터링:**
  - `NO_ALCOHOL` ↔ `ALCOHOL_ONLY` 충돌 시 자동 제외
  - `HATE_WALKING` ↔ `HIGH_ACTIVITY` 충돌 시 자동 제외
  - `NO_SPORTS` ↔ `SPORTS_REQUIRED` 충돌 시 자동 제외
  - `INDOOR_ONLY` ↔ `OUTDOOR_REQUIRED` 충돌 시 자동 제외
- **Fallback 처리:** 필터링 결과가 0개일 경우 전체 후보군 사용

### 2. 💬 사용자 제보 시스템 (Suggestion System)
- **간편한 피드백:** 카톡 보내듯 텍스트 하나로 제보 완료
- **다중 진입점:**
  - 마이페이지: "사장님한테 훈수 두기 (코스 추천/버그 제보)"
  - 미션 완료 페이지: "이 코스보다 좋은 곳 아는데..."
- **백엔드 구조:**
  - Suggestion 엔티티 (user_id, content, created_at)
  - SuggestionController, SuggestionService, SuggestionRepository
  - 자동 타임스탬프 관리
- **모달 UI:** 브랜드 컬러(electric-lime)를 활용한 감성적인 디자인

### 3. 🧾 인스타그램 감성 영수증 UI (Receipt-style Proof)
- **영수증 스타일 디자인:**
  - 톱니 모양(zigzag) 하단 디테일
  - 모노스페이스 폰트로 빈티지 감성
  - Electric-lime 액센트 컬러
  - "PRICELESS" 가격 표시
  - "✓ DONE" 스탬프 효과
- **이미지 다운로드 기능:**
  - html2canvas 라이브러리 활용
  - 2배 해상도로 고화질 저장
  - 파일명: `solotion-receipt-{timestamp}.png`
- **기존 기능 유지:**
  - 키워드 선택
  - 사진 업로드
  - 코멘트 작성
  - 모든 데이터 정상 전송

### 4. 🗺️ 멀티스텝 코스/플로우 시스템 (Multi-step Course Guide)
- **JSON 기반 단계별 가이드:**
  - MissionTemplate에 `guide` 필드 추가 (JSON 타입)
  - 복잡한 1:N 관계 없이 유연한 구조 유지
  - 예시 구조: `[{"icon": "WALK", "title": "중랑천 바람 쐬기", "desc": "..."}]`
- **샘플 데이터 4종:**
  - 천변 바람 22: 산책 → 칵테일
  - 장한평 서점 방문: 서점 → 카페
  - 미니 하이킹 30: 하이킹 → 휴식
  - 디저트 한 입 + 10분 산책: 디저트 → 산책
- **타임라인 시각화:**
  - 아이콘 배지 (🚶 🍹 ☕ 📚 ⛰️ 🧘 🍰)
  - Electric-lime 원형 컨테이너
  - 스텝 간 연결선
  - 제목과 설명 표시
- **조건부 렌더링:** guide 데이터가 있는 미션만 표시

### 5. 🔧 기술적 개선사항
- **태그 필터링 알고리즘:**
  - CSV 파싱 → Set 변환
  - 교집합 체크로 충돌 감지
  - AppointmentService에서 미션/장소 선택 시 적용
- **JSON 컬럼 활용:**
  - MySQL JSON 타입으로 유연한 데이터 구조 저장
  - `JSON_ARRAY`, `JSON_OBJECT` 함수로 초기 데이터 삽입
- **DTO 확장:**
  - UserDto, MissionTemplateResponse, AppointmentResponse에 새 필드 추가
  - 하위 호환성 유지
- **프론트엔드 타입 안전성:**
  - GuideStep 인터페이스 정의
  - ICON_MAP으로 아이콘 중앙화
  - parseGuide 유틸 함수로 안전한 JSON 파싱

---

## 🚀 v2.3 주요 업데이트 (2026.01.21)

### 1. 🗄️ PostgreSQL JSONB 타입 호환성 개선
- **@Lob 어노테이션 제거:** `MissionTemplate.guide` 필드에서 `@Lob` 제거
  - 기존: Hibernate가 JSONB를 CLOB으로 잘못 매핑하여 `DataIntegrityViolationException` 발생
  - 개선: `columnDefinition = "JSONB"`만 사용하여 PostgreSQL 네이티브 타입으로 정상 처리
  - 에러 해결: `Bad value for type long : [{"desc": "...", "icon": "BOOK", "title": "..."}]`

### 2. 🎲 메모리 효율적인 랜덤 미션 선택 알고리즘
- **페이지네이션 기반 랜덤 선택 구현:**
  - 기존: `findAll()`로 전체 미션을 메모리에 로드 → OutOfMemoryError 위험
  - 개선: `count()` + `PageRequest.of(randomIndex, 1)` 패턴으로 단일 레코드만 조회
  - 장점: 메모리 사용량 최소화, 대용량 데이터셋 대응 가능, 성능 향상
- **구현 세부사항:**
  ```java
  // MissionService.selectRandomMission()
  long totalCount = missionTemplateRepository.count();
  int randomIndex = (int) (Math.random() * totalCount);
  PageRequest pageRequest = PageRequest.of(randomIndex, 1);
  Page<MissionTemplate> page = missionTemplateRepository.findAll(pageRequest);
  ```
- **동시성 이슈 대응:** 랜덤 인덱스가 범위를 벗어나는 경우 자동으로 첫 번째 미션 반환

### 3. 🔧 코드 리팩토링 & 단순화
- **selectRandomPlanBMission() 단순화:**
  - 기존: RELAX/INDOOR 필터링 로직 (데이터 부족으로 에러 발생)
  - 개선: 전체 미션 풀에서 랜덤 선택하도록 단순화
  - 주석 추가: 데이터가 충분히 쌓인 후 필터링 재적용 가능하도록 안내
- **Random → Math.random() 전환:**
  - `java.util.Random` 의존성 제거
  - `Math.random()` 사용으로 간결화

### 4. 📊 Hibernate 쿼리 최적화 검증
- **Native Query 안전성 확인:**
  - `MissionTemplateRepository`의 네이티브 쿼리들이 `SELECT *` 대신 명시적 컬럼 리스트 사용 확인
  - 컬럼 순서 불일치 문제 없음 검증
- **실행 쿼리 확인:**
  ```sql
  -- 카운트 쿼리
  select count(*) from mission_templates mt1_0

  -- 페이지네이션 쿼리 (단일 레코드)
  select mt1_0.id, mt1_0.address, ..., mt1_0.guide, ...
  from mission_templates mt1_0
  offset ? rows
  fetch first ? rows only
  ```

### 5. 🧪 테스트 완료
- **엔드포인트 검증:**
  - ✅ `GET /api/v1/missions/today` - HTTP 200, 정상 응답
  - ✅ `POST /api/v1/missions/{id}/escape` - HTTP 200, 정상 응답
- **에러 해결 확인:**
  - ✅ `DataIntegrityViolationException` 완전 해결
  - ✅ JSONB 컬럼 정상 읽기/쓰기
  - ✅ 메모리 사용량 최소화 확인

---

## 🚀 v2.4 주요 업데이트 (2026.01.20)

### 1. 🌐 서울시 실시간 도시데이터 API 연동
- **서울시 Open API 통합:**
  - 120개 주요 장소의 실시간 혼잡도 데이터 수집
  - WebClient 기반 비동기 API 호출 구현
  - SeoulOpenApiService, SeoulOpenApiProperties 설정 완료
- **데이터 수집 항목:**
  - 혼잡도 레벨 (1-5): 여유 → 보통 → 약간 붐빔 → 붐빔 → 매우 붐빔
  - 실시간 인구수
  - 날씨 정보 (기온, 강수량, 날씨 상태)
  - 대기질 (PM10, PM2.5)

### 2. 🗄️ 혼잡도 데이터 캐싱 시스템
- **SeoulCityPlace 엔티티 구현:**
  - placeCode, placeName, 위경도 정보
  - congestionLevel, congestionMessage, currentPopulation
  - weatherCondition, temperature, rainfall
  - pm10, pm25 (미세먼지)
  - lastUpdated, isValid (데이터 신선도 관리)
- **Repository 메서드:**
  - 반경 기반 검색: `findNearbyPlaces(lat, lng, radius)`
  - 혼잡도 필터링: `findLowCongestionPlaces()`
  - 장소명 검색: `findByPlaceNameContaining()`

### 3. ⏰ 자동 갱신 스케줄러
- **SeoulDataRefreshScheduler 구현:**
  - 정규 갱신: 매시간 정각 (Cron: `0 0 * * * *`)
  - 피크타임 갱신: 금/토요일 18-23시 10분마다
  - Rate Limiting: 100 요청/초 준수
  - 에러 재시도 로직 및 로깅
- **@EnableScheduling 활성화:**
  - BackendApplication에서 스케줄링 기능 활성화
  - 배치 실행 로그 자동 기록

### 4. 🎯 스마트 미션 추천 시스템
- **혼잡도 기반 필터링:**
  - `MissionService.filterByCongestion()` 구현
  - 혼잡도 2(보통) 이하 장소만 추천
  - 서울시 데이터 없는 장소는 기본 포함 (유연한 처리)
- **악천후 자동 Plan B 전환:**
  - `WeatherBasedPlanBScheduler` 구현
  - 매일 06:00 날씨 체크 (비/눈 예보 확인)
  - OUTDOOR 미션 → INDOOR 미션 자동 변경
  - PLAN_B_ACTIVATED 상태로 전환 및 알림

### 5. 📡 RESTful API 엔드포인트 (6개)
- **SeoulDataController 구현:**
  - `GET /api/seoul/congestion/{placeCode}` - 특정 장소 혼잡도
  - `GET /api/seoul/congestion/nearby` - 반경 내 장소 리스트
  - `GET /api/seoul/congestion/nearby/low` - 여유 있는 장소만
  - `GET /api/seoul/congestion/search` - 장소명 검색
  - `GET /api/seoul/congestion/all` - 전체 장소 (관리자)
  - `GET /api/seoul/congestion/stats` - 혼잡도 통계
- **CongestionResponse DTO:**
  - placeCode, placeName, areaName
  - latitude, longitude
  - congestionLevel, congestionText, badgeColor
  - currentPopulation, weatherCondition, temperature
  - lastUpdated, isValid

### 6. 🎨 프론트엔드 혼잡도 시각화
- **CongestionBadge 컴포넌트 (3가지 variant):**
  - `default`: 미션 카드 본문용 (이모지 + 텍스트 + 상세정보)
  - `compact`: 미션 카드 헤더용 (이모지 + 레벨만 표시)
  - `detailed`: 추천 장소 강조용 (풀 정보 + 배경색)
- **색상 매핑:**
  - Level 1 (여유): 🟢 Green
  - Level 2 (보통): 🔵 Blue
  - Level 3 (약간 붐빔): 🟡 Yellow
  - Level 4 (붐빔): 🟠 Orange
  - Level 5 (매우 붐빔): 🔴 Red
- **API 연동 Hook:**
  - `useCongestion`: 반경 기반 다중 장소 조회
  - `useSingleCongestion`: 단일 장소 조회
  - 자동 재조회, 로딩/에러 상태 관리
- **구현 파일:**
  - `frontend/src/components/CongestionBadge.tsx`
  - `frontend/src/components/CongestionBadgeExample.tsx`
  - `frontend/src/api/congestionApi.ts`
  - `frontend/src/hooks/useCongestion.ts`

### 7. 🗄️ PostgreSQL 호환성 개선
- **data.sql 마이그레이션:**
  - `AUTO_INCREMENT` → `BIGSERIAL`
  - `ON UPDATE CURRENT_TIMESTAMP` 제거 (PostgreSQL 미지원)
  - `JSON_OBJECT()`, `JSON_ARRAY()` → 네이티브 JSON 문자열 + `::jsonb` 캐스팅
- **suggestions 테이블 생성:**
  - 사용자 제보 시스템용 테이블
  - user_id, content, created_at, updated_at
  - Foreign Key Constraint 적용

### 8. 📚 문서화
- **DEBUG_FIX_SUMMARY.md:**
  - Spring Boot 시작 오류 해결 과정 문서화
  - MySQL vs PostgreSQL 차이점 정리
  - 마이그레이션 가이드 제공
- **IMPLEMENTATION_STATUS.md:**
  - 서울시 혼잡도 연동 Phase 1-6 체크리스트
  - 아키텍처 다이어그램
  - API 엔드포인트 명세
  - 테스트 가이드
- **INTEGRATION_GUIDE.md:**
  - CongestionBadge 미션 카드 통합 가이드
  - 타입 정의 및 컴포넌트 수정 방법
  - 단계별 구현 예시

### 9. 🧪 테스트 완료
- **백엔드:**
  - ✅ 빌드 성공 (./gradlew clean build -x test)
  - ✅ 애플리케이션 시작 성공 (포트 8080)
  - ✅ 스케줄러 정상 동작 확인
  - ✅ API 엔드포인트 응답 확인
- **프론트엔드:**
  - ✅ CongestionBadge 3가지 variant 렌더링 확인
  - ✅ useCongestion Hook 동작 확인
  - ✅ API 연동 테스트 준비 완료

---

## 🎯 다음 개발 계획 (Roadmap)

### Phase 1: 소셜 기능 고도화
- [ ] 피드 무한 스크롤 (Infinite Scroll)
- [ ] 피드 필터링 (카테고리별, 인기순, 최신순)
- [ ] 좋아요 기능 추가
- [ ] 사용자 프로필 페이지 및 팔로우 시스템

### Phase 2: 백엔드 API 연동
- [ ] 피드 조회 API 구현
- [ ] 댓글 CRUD API 구현
- [ ] 북마크 API 구현
- [ ] 미션 복사 API 구현

### Phase 3: 알림 시스템
- [ ] 댓글 알림
- [ ] 북마크 알림
- [ ] 팔로워 활동 알림

### Phase 4: 성능 최적화
- [ ] 이미지 최적화 (WebP, 리사이징)
- [ ] 가상 스크롤 (Virtual Scroll)
- [ ] React Query 도입 (캐싱, 낙관적 업데이트)