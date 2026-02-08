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

### 3. Super Admin Mock 모드 (개발 전용)
백엔드 없이 프론트엔드 전체 플로우를 테스트할 수 있는 개발자 모드입니다.

**빠른 시작:**
1. 로그인 페이지(`/login`)로 이동
2. 화면 하단의 **"🔓 Super Admin (개발 전용)"** 버튼 클릭
3. 자동으로 Mock 토큰이 생성되고 피드 페이지로 이동

**특징:**
- ngrok 무료 버전 1포트 제약 해결 (프론트엔드만 열면 됨)
- 20개 Mock 피드, 3개 Mock 약속 자동 생성
- 실제 API 호출 없이 전체 UI/UX 확인 가능
- 모바일 디바이스에서도 테스트 가능

**참고:** 상세한 사용법은 `SUPER_ADMIN_GUIDE.md` 참조

**위치 권한 참고사항:**
- Geolocation API는 HTTPS 연결에서만 동작합니다 (localhost 제외)
- 실제 디바이스에서 위치 기능 테스트 시 ngrok HTTPS URL 필수
- 또는 로컬 인증서 발급 (mkcert 등) 후 HTTPS로 개발 서버 실행

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

## 🚀 v2.5 주요 업데이트 (2026.01.21)

### 1. 🏠 공개 피드 중심 홈 화면 재구성
- **피드 기반 홈 페이지:** 기존 미션 추천 중심에서 공개 피드 기반 홈으로 전환
  - 다른 사용자들의 완료된 미션 인증샷을 카드 형태로 표시
  - 닉네임 마스킹 처리로 개인정보 보호 (예: "홍*동")
  - 상대 시간 표시 (예: "3시간 전", "2일 전")
- **인증 필요 없는 공개 API:**
  - `/api/v1/appointments/feed` 엔드포인트를 인증 없이 접근 가능하도록 설정
  - SecurityConfig에서 `.permitAll()` 처리
  - 누구나 피드를 둘러볼 수 있어 서비스 매력도 향상

### 2. 🧭 위치 설정 페이지 (Location Setting)
- **온보딩 후 위치 설정 단계 추가:**
  - 로그인 → 온보딩 → **위치 설정** → 미션 추천 플로우
  - GPS 자동 감지 (navigator.geolocation API)
  - 서울 핫스팟 빠른 선택 (성수, 홍대, 강남, 이태원, 을지로)
- **LocalStorage 기반 상태 관리:**
  - 선택한 위치를 localStorage에 저장
  - 미션 추천 시 저장된 위치 활용
  - 중복 위치 요청 방지로 UX 개선

### 3. 🎯 스마트 네비게이션 (Smart Navigation)
- **중앙 FAB 버튼 로직 개선:**
  - 기존 약속 존재 → 약속 상세 페이지로 이동
  - 약속 없음 → 위치 설정 페이지로 이동
  - localStorage 기반 즉각 반응 (useNextAppointment 훅보다 빠름)
- **하단 네비게이션 재구성:**
  - 좌측: 피드 (홈) - 공개된 인증샷 피드
  - 중앙: 스마트 버튼 - 상황에 맞는 다음 액션
  - 우측: 마이페이지 - 프로필 및 설정

### 4. 🗄️ 데이터베이스 스키마 확장
- **Appointment 엔티티 필드 추가:**
  - `is_public` (boolean): 피드 공개 여부 (기본값: false)
  - `completed_at` (timestamp): 약속 완료 시간
- **성능 최적화 인덱스:**
  - `idx_appointments_feed`: (status, is_public, completed_at DESC)
  - WHERE 조건: `status = 'COMPLETED' AND is_public = true`
  - 피드 조회 쿼리 성능 최적화

### 5. 📱 프론트엔드 리팩토링
- **FeedPage 실제 API 연동:**
  - 기존 Mock 데이터 → 실제 Backend API 호출
  - 페이지네이션 구현 (page, size 파라미터)
  - 더보기 버튼으로 추가 로드
- **MyPage 단순화:**
  - 중복되는 약속 리스트 제거 (피드에서 확인 가능)
  - 프로필, 지원, 계정 관리 섹션만 유지
  - 깔끔한 UI로 사용자 경험 개선
- **App.tsx 라우팅 변경:**
  - 기본 경로: `/feed` (이전: `/missions`)
  - 로그인 후 리다이렉트: `/feed`
  - LandingGuard 목적지 변경

### 6. 🔧 백엔드 구현
- **FeedResponse DTO:**
  - appointmentId, missionTitle, placeName
  - proofImageUrls, proofComment, reviewKeywords
  - userNickname (마스킹 처리), completedAt
  - `maskNickname()`: 첫 글자 제외 "*"로 치환
- **AppointmentRepository 쿼리 메서드:**
  ```java
  List<Appointment> findAllByStatusAndIsPublicTrueOrderByCompletedAtDesc(
    AppointmentStatus status, Pageable pageable
  );
  ```
- **AppointmentService 필터링 로직:**
  - 완료 상태 + 공개 설정 + 인증샷 있음 조건
  - Stream API로 이미지 없는 항목 자동 제외
  - 최신순 정렬 (completedAt DESC)

### 7. 📋 문서화
- **QUICK_START.md:** 빠른 시작 가이드 (테스트 데이터 추가 방법)
- **SETUP_COMPLETE.md:** 상세 구현 보고서 및 해결한 문제들
- **FEED_FEATURE_STATUS.md:** 기능 상태 문서
- **test-feed-api.sh:** API 자동 테스트 스크립트

### 8. 🐛 해결한 주요 이슈
- **이슈 1: Feed API 인증 문제**
  - 증상: API 호출 시 로그인 페이지 HTML 반환
  - 원인: SecurityConfig에서 모든 `/api/v1/appointments/**` 경로 인증 요구
  - 해결: Feed 엔드포인트를 `.permitAll()`로 예외 처리
- **이슈 2: ddl-auto 충돌**
  - 증상: Hibernate가 NOT NULL 컬럼 추가 시 에러
  - 해결: `ddl-auto: validate`로 변경, 수동 SQL 스크립트 제공

---

## 🚀 v2.6 주요 업데이트 (2026.01.23)

### 1. 💚 피드 상태 영속화 (Like & Save Persistence)
- **좋아요/저장 상태 백엔드 영속화:**
  - LikedAppointment, SavedAppointment 엔티티 추가 (N:M 관계)
  - 페이지 새로고침 후에도 상태 유지
  - FeedResponse DTO에 `isLikedByMe`, `isSavedByMe` 필드 추가
- **Optimistic Update 패턴:**
  - 클릭 즉시 UI 업데이트
  - API 실패 시 자동 롤백
  - 사용자 경험 향상
- **EscLikeButton 리팩토링:**
  - Uncontrolled → Controlled Component
  - 부모 컴포넌트에서 상태 관리
  - 애니메이션 효과 유지 (💚 이모지)

---

## 🚀 v2.7 주요 업데이트 (2026.01.24)

### 1. 🗄️ 아카이브 상세 페이지 (Archive Detail Page)
- **완료/취소된 약속 전용 상세 페이지:**
  - 진행 중인 약속과 차별화된 아카이브 스타일 UI
  - 중앙 배치 상태 배지 (✓ 완료된 약속 / × 취소된 약속)
  - 아카이브 아이콘 헤더 및 장식적인 하단 디테일
  - 완료된 약속의 인증 사진, 리뷰 키워드, 별점 표시
- **스마트 라우팅:**
  - 완료/취소 약속: `/archived/:appointmentId`
  - 진행 중인 약속: `/mission/:appointmentId`
  - Appointments 페이지에서 자동 분기

### 2. 📸 다중 이미지 업로드 시스템 개선
- **5장 제한 및 UI 피드백:**
  - 5장 초과 시 명확한 안내 메시지
  - 현재 업로드된 사진 수 실시간 표시 (예: "사진 추가 (3/5)")
  - 파일 타입 및 크기 검증 (이미지만, 5MB 이하)
  - 이미지 슬롯 UI 개선 (남은 슬롯 수만큼만 표시)
- **스와이프 형태 다중 이미지 조회:**
  - ImageCarousel 컴포넌트로 여러 장 사진 표시
  - 피드 및 약속 상세 페이지에서 활용
  - Backend 다중 이미지 업로드 API 정상 동작 확인

### 3. 🔓 Super Admin Mock 모드
- **백엔드 없는 개발 환경 구축:**
  - ngrok 무료 버전 1포트 제약 해결
  - Mock 데이터 시스템으로 전체 플로우 테스트 가능
  - 개발 환경에서만 표시되는 Super Admin 버튼
- **Mock 데이터 시스템:**
  - `utils/mockData.ts`: Mock 데이터 생성 유틸리티
  - 20개 피드, 3개 약속 (진행중 1, 완료 2) 자동 생성
  - 랜덤 데이터로 다양한 시나리오 테스트
- **API 요청 인터셉션:**
  - Mock 모드 감지 시 백엔드 호출 우회
  - 300ms 지연으로 실제 API 응답 시뮬레이션
  - 지원 엔드포인트: 피드, 약속, 유저 정보 등
- **상세 문서화:**
  - `SUPER_ADMIN_GUIDE.md`: 사용 가이드
  - Mock 데이터 커스터마이징 방법
  - 테스트 시나리오 및 트러블슈팅

### 4. 📍 위치 권한 처리 개선
- **HTTPS 필수 요구사항 검증:**
  - Geolocation API는 HTTPS에서만 동작 (localhost 제외)
  - HTTPS 미사용 시 명확한 안내 메시지
  - 실제 디바이스 테스트를 위한 ngrok HTTPS URL 안내
- **에러 처리 강화:**
  - 위치 권한 거부 시 상세한 안내
  - Timeout 15초로 증가
  - GPS 정확도 향상 옵션 (enableHighAccuracy)
  - 상세한 콘솔 로깅

### 5. 📲 모바일 앱 스타일 뒤로가기 처리
- **루트 페이지 뒤로가기 두 번 = 앱 종료:**
  - 네이티브 앱과 동일한 UX 제공
  - popstate 이벤트 핸들링
  - 2초 이내 두 번 뒤로가기 감지
- **루트 페이지 정의:**
  - `/feed`, `/appointments`, `/reviews`, `/mypage`
  - 루트 페이지가 아닌 경우 일반 뒤로가기 동작
- **사용자 친화적 토스트 알림:**
  - 첫 번째: "뒤로가기 버튼을 한 번 더 누르면 종료됩니다"
  - 두 번째: 앱 종료 또는 안내 메시지
- **PWA 호환성:**
  - window.history 조작으로 히스토리 스택 관리
  - PWA 환경에서 최적화된 동작

### 6. 🔧 기술적 개선사항
- **TypeScript 타입 안전성 강화:**
  - `Appointment` 인터페이스에 `completedAt` 필드 추가
  - FeedItem 타입 정확성 개선
- **컴포넌트 모듈화:**
  - `ArchivedAppointmentDetail.tsx`: 아카이브 상세 페이지
  - `useBackButtonHandler.ts`: 뒤로가기 핸들러 Hook
- **프로덕션 빌드 안전성:**
  - Super Admin 버튼은 개발 환경에서만 표시
  - `import.meta.env.DEV` 조건부 렌더링
- **React Router v6 최적화:**
  - `useNavigate` 훅 활용
  - window.location 대신 React Router 네비게이션

### 2. 🗄️ 저장한 일탈 페이지 구현
- **SavedAppointments 페이지:**
  - 저장한 약속 그리드 레이아웃
  - 썸네일 이미지, 미션 제목, 장소명 표시
  - 호버 시 삭제 버튼 표시
  - 저장 취소 기능 (Optimistic Update)
- **마이페이지 연동:**
  - "저장한 일탈" 메뉴 항목 추가
  - 카운트 및 안내 문구
  - 빈 상태 처리

### 3. 🧭 네비게이션 및 라우팅 대규모 개선
- **MissionDetail BottomNav 표시:**
  - MissionDetail을 MainLayout 내부로 이동
  - 하단 네비게이션이 모든 페이지에서 일관되게 표시
  - pb-24 추가로 콘텐츠 겹침 방지
- **리스트 항목 클릭 버그 수정:**
  - Appointments: `/chat/:id` → `/mission/:id` (잘못된 경로 수정)
  - SavedAppointments: TODO 주석 → `/mission/:id` 네비게이션 구현
  - 과거 약속 클릭 시 해당 약속의 상세 정보 정상 표시
- **스마트 뒤로가기 버튼:**
  - 하드코딩된 `/mypage` → `location.state?.from` 또는 `navigate(-1)`
  - 브라우저 히스토리 활용
  - 사용자가 온 경로로 정확히 복귀
- **에러/완료 후 리다이렉트 개선:**
  - 약속 완료/에러 시 `/mypage` → `/appointments`로 이동
  - 더 직관적인 사용자 흐름

### 4. 🛡️ Route Guards 개선
- **RequireOnboarded 로직 수정:**
  - 약속이 있는 사용자는 온보딩 완료 여부와 무관하게 피드/마이페이지 접근 허용
  - 약속 보유자의 무한 리다이렉트 버그 해결
- **GlobalRedirectWrapper 예외 경로 추가:**
  - `/appointments`, `/reviews` 추가
  - 사용자 경험 개선

### 5. 🎨 UI/UX 최적화
- **Debug Overlay 개선:**
  - 토글 버튼(🛠️) 추가 (우측 상단 고정)
  - localStorage로 표시/숨김 상태 저장
  - 개발 환경에서만 활성화
- **MainLayout 개선:**
  - 상단 배너 제거 → FAB(Floating Action Button)로 대체
  - 진행 중인 약속 알림 FAB (우측 하단)
  - 티켓 아이콘 + 펄스 애니메이션
  - Glow 효과 (네온 스타일)
- **MissionDetail 스크롤 최적화:**
  - 스크롤 방향 감지 (아래로 스크롤 시 버튼 숨김)
  - Spring 애니메이션으로 부드러운 전환
  - 콘텐츠 읽기에 집중
- **D-Day 배지 디자인 개선:**
  - 버튼처럼 보이지 않도록 수정
  - `bg-electric-lime/20`, `text-electric-lime`
  - `cursor-default`, `select-none`
- **Appointments 다크 테마 적용:**
  - 모든 색상을 네온 다크 테마로 통일
  - 상태 배지, 필터 버튼, 로딩 스피너
  - 일관된 브랜드 경험

### 6. 🔧 기술적 개선
- **RouteGuards 모듈화:**
  - `frontend/src/routes/RouteGuards.tsx` 파일 분리
  - RequireNewUser, RequireAppointment, RequireOnboarded, SmartRedirect
  - 재사용 가능한 라우트 가드 컴포넌트
- **Toast 시스템:**
  - `frontend/src/utils/toast.ts` 유틸 추가
  - 일관된 알림 메시지 표시
- **타입 안전성 강화:**
  - FeedItem 인터페이스에 `isLikedByMe`, `isSavedByMe` 추가
  - 백엔드-프론트엔드 타입 동기화

### 7. 🐛 주요 버그 수정
- **버그 1: 리스트 항목 클릭 시 현재 약속 표시**
  - 증상: 과거 약속 클릭 시 현재 진행 중인 약속이 표시됨
  - 원인: URL 파라미터 무시, localStorage만 참조
  - 해결: 리스트에서 올바른 ID를 URL에 전달하도록 수정
- **버그 2: 약속 보유자 무한 리다이렉트**
  - 증상: 약속이 있는데도 온보딩 페이지로 계속 이동
  - 원인: RequireOnboarded가 온보딩 미완료 시 무조건 차단
  - 해결: 약속 보유자는 온보딩 여부와 무관하게 접근 허용
- **버그 3: 저장한 일탈 클릭 시 무반응**
  - 증상: SavedAppointments에서 항목 클릭 시 아무 동작 없음
  - 원인: TODO 주석만 있고 네비게이션 미구현
  - 해결: `/mission/${item.appointmentId}` 네비게이션 구현

---

## 🚀 v3.0 주요 업데이트 (2026.01.25)

### 1. 📚 공공 API 데이터 수집 시스템 (Public API Data Collection)
- **도서관정보나루 API 연동:**
  - 서울시 도서관 200개 자동 수집 및 저장
  - 인기 대출 도서 30권 (20대 타겟) 주간 수집
  - 도서 소장/대출 가능 여부 실시간 조회 (1시간 캐싱)
  - Library, PopularBook 엔티티로 데이터 관리
- **KOPIS 공연예술통합전산망 API 확장:**
  - 공연 상세 정보 조회 (티켓 가격, 공연 시간, 좌석 정보)
  - 축제 목록 수집 및 필터링
  - 종료된 공연 자동 비활성화 (isActive = false)
- **서울시 열린데이터광장 API 확장:**
  - 공원 현황 200개 수집 (SearchParkInfoService)
  - 공공서비스예약 문화행사 수집 (ListPublicReservationCulture)
  - 기존 모범음식점 로직 유지

### 2. 🎯 2030 1인가구 타겟 콘텐츠 필터링 (Content Filtering)
- **ContentFilteringService 구현:**
  - 제외 키워드: 아동, 가족, 초등, 중등, 유아, 방학, 어린이, 키즈, 교육, 체험학습
  - 최대 허용 가격: 70,000원 (7만원 초과 공연 자동 제외)
  - 이용대상 필터링: 아동/초등/유아 대상 행사 제외
- **가격 파싱 로직:**
  - "R석 70,000원, S석 50,000원" → 최저가 50,000원 추출
  - "전석 무료" → 0원 처리

### 3. ⏰ 자동 데이터 수집 스케줄러 (DataCollectionScheduler)
- **주간 수집 (매주 월요일 04:00):**
  - 인기 대출 도서 (20대, 서울)
  - 공연/축제 목록
- **일간 수집 (매일 05:00):**
  - 문화행사 정보
  - 종료된 공연/행사 비활성화
- **월간 수집 (매월 1일 03:00):**
  - 도서관 정보 갱신
  - 공원 정보 갱신
- **앱 시작 시 (1회):**
  - 데이터 없을 경우 초기 로드

### 4. 🔧 Admin API 확장
| 엔드포인트 | 설명 |
|-----------|------|
| `POST /api/admin/data/collect/libraries` | 도서관 수동 수집 |
| `POST /api/admin/data/collect/popular-books` | 인기도서 수동 수집 |
| `POST /api/admin/data/collect/performances` | 공연/축제 수동 수집 |
| `POST /api/admin/data/collect/cultural-events` | 문화행사 수동 수집 |
| `POST /api/admin/data/collect/parks` | 공원 수동 수집 |
| `POST /api/admin/data/collect/all` | 전체 수집 (비동기) |
| `GET /api/admin/data/test/book-exist` | 도서 소장/대출 테스트 |
| `GET /api/admin/data/stats` | 수집 통계 조회 |

### 5. 🗄️ 데이터베이스 스키마 확장
- **Place 엔티티 필드 추가:**
  - `startDate`, `endDate`: 공연/행사 기간
  - `ticketPrice`: 최저 티켓 가격 (원)
  - `isFree`: 무료 여부
  - `dataSource`: 데이터 출처 (KOPIS, SEOUL_CULTURE, LIBRARY 등)
  - `externalId`: 외부 API 고유 ID (중복 방지)
  - `isActive`: 활성 상태 (종료 공연은 false)
  - `performanceState`: 공연 상태 (공연중, 공연예정, 공연완료)
- **신규 엔티티:**
  - `Library`: 도서관 정보 (libraryCode, closedDays, operatingTime)
  - `PopularBook`: 인기 도서 (isbn, ranking, loanCount, collectedAt)
  - `DataSource` enum: 데이터 출처 구분

### 6. 🚀 Caffeine Cache 도입
- **캐시 적용 항목:**
  - `bookExistence`: 도서 소장/대출 조회 (1시간)
  - `bookDetail`: 도서 상세 정보 (1시간)
  - `bookKeywords`: 도서 키워드 (1시간)
  - `nearbyBookAvailability`: 주변 도서관 대출 가능 (1시간)
- **의존성 추가:**
  - `spring-boot-starter-cache`
  - `com.github.ben-manes.caffeine:caffeine:3.1.8`

### 7. 🛠️ 기술적 개선
- **서비스 통합 리팩토링:**
  - DataIngestionService → DataCollectionService 리네이밍
  - 도서관, KOPIS, 서울시 수집 로직 통합
  - ContentFilteringService 분리
- **Hibernate 세션 안정성:**
  - 개별 항목 처리 실패 시 `entityManager.clear()` 호출
  - 세션 오염 방지로 후속 항목 정상 처리
- **PlaceRepository 확장:**
  - `findByExternalId()`: 중복 방지용 조회
  - `findByDataSource()`: 데이터 출처별 조회
  - `deactivateExpiredPerformances()`: 종료 공연 일괄 비활성화

### 8. 📋 구현 파일 목록
```
backend/src/main/java/com/littleescape/api/
├── domain/
│   ├── Library.java                 # 도서관 엔티티
│   ├── PopularBook.java             # 인기도서 엔티티
│   └── type/DataSource.java         # 데이터 출처 Enum
├── repository/
│   ├── LibraryRepository.java
│   └── PopularBookRepository.java
├── dto/ingestion/
│   ├── PopularBookResponse.java     # 인기도서 응답
│   ├── BookExistResponse.java       # 도서 소장/대출 응답
│   ├── BookDetailResponse.java      # 도서 상세 응답
│   ├── BookKeywordResponse.java     # 도서 키워드 응답
│   ├── PerformanceDetailResponse.java  # 공연 상세 응답
│   ├── FestivalResponse.java        # 축제 목록 응답
│   ├── SeoulParkResponse.java       # 공원 응답
│   └── PublicReservationCultureResponse.java  # 공공예약 응답
├── config/
│   └── CacheConfig.java             # Caffeine 캐시 설정
├── service/
│   ├── DataCollectionService.java   # 통합 수집 서비스
│   ├── ContentFilteringService.java # 콘텐츠 필터링
│   └── LibraryApiService.java       # 도서 실시간 조회
└── scheduler/
    └── DataCollectionScheduler.java # 자동 수집 스케줄러
```

---

## 🚀 v3.1 주요 업데이트 (2026.01.31)

### 1. 🗄️ Place 허브+디테일 테이블 아키텍처 (Hub & Detail Pattern)
- **PlaceDetailPerformance 엔티티 추가:**
  - 공연/축제 전용 상세 필드 분리 (공연 상태, 시작/종료일, 티켓가격, 장르 등)
  - Place 엔티티와 1:1 관계 (`@OneToOne`, `@MapsId`)
  - PlaceDetailPerformanceRepository: 활성 공연 조회, 무료 공연 필터, 장르 검색
- **PlaceDetailFacility 엔티티 추가:**
  - 시설(도서관/공원/음식점) 전용 상세 필드 (운영시간, 휴관일, 입장료, 편의시설 등)
  - Place 엔티티와 1:1 관계
  - PlaceDetailFacilityRepository: 무료 시설, 편의시설 키워드 검색
- **DataCollectionService Dual-Write 패턴:**
  - 데이터 수집 시 Place(허브) + Detail(공연/시설) 동시 저장
  - KOPIS 공연 데이터 → PlaceDetailPerformance 자동 매핑
  - 문화행사/공원/도서관 → PlaceDetailFacility 자동 매핑

### 2. 📍 위치 Selectbox 통합 (Location Selectbox Unification)
- **LocationSelectbox 공유 컴포넌트:**
  - 구(district) → 핫스팟(area) 2단계 드롭다운 선택
  - `variant` prop으로 dark/light 테마 지원
  - `onSelect` 콜백: `{district, name, lat, lng}` 반환
- **서울시 120개 핫스팟 데이터 완전 수록:**
  - `seoulDistricts.ts`: 24개 구, 120개 핫스팟 전체 데이터
  - `init-seoul-places.sql`에서 추출한 정확한 WGS84 좌표 사용
  - 타입: `Hotspot`, `District`, `SEOUL_DISTRICTS`, `ALL_HOTSPOTS`
- **3개 페이지 통합 적용:**
  - **ChatAppointment:** 텍스트 입력 → selectbox (dark variant)
  - **LocationSetting:** 5개 버튼 프리셋 → selectbox (dark variant)
  - **DevConsole:** 5개 프리셋 → selectbox (light variant), 랜덤 시나리오 120개 지역 활용
- **localStorage 호환성 유지:**
  - `default_location`: 지역명 (string)
  - `user_location`: `{lat, lng, name}` (JSON) - 기존 소비자 호환

### 3. 📝 로깅 시스템 구축 (Logback Configuration)
- **logback-spring.xml 설정 추가:**
  - 콘솔 출력: 컬러 포맷, 간결한 로거명
  - 파일 출력: 일별 롤링, 최대 30일/1GB 보관
  - 에러 전용 파일: ERROR 레벨만 별도 기록
  - 스케줄러 전용 파일: 데이터 수집 로그 분리
- **로그 레벨 세분화:**
  - 앱 코드: DEBUG
  - Hibernate SQL: DEBUG (바인딩 파라미터 포함)
  - Spring Security: WARN
  - 외부 라이브러리: INFO

### 4. 🧹 SQL 파일 정리
- **불필요한 임시 SQL 파일 삭제:**
  - `add-feed-columns.sql`, `fix-feed-columns.sql`, `test-feed-data.sql` 제거
- **init-seoul-places.sql 경로 이동:**
  - `resources/` → `resources/db/data/` 디렉토리로 정리
- **data.sql PostgreSQL 호환성 개선:**
  - 중복 키워드 정리, 구문 최적화

### 5. 📋 구현 파일 목록
```
backend/src/main/java/com/littleescape/api/
├── domain/
│   ├── Place.java                          # 허브 테이블 (필드 추가)
│   ├── PlaceDetailPerformance.java         # 공연 디테일 테이블 (신규)
│   └── PlaceDetailFacility.java            # 시설 디테일 테이블 (신규)
├── repository/
│   ├── PlaceRepository.java                # 확장 쿼리 추가
│   ├── PlaceDetailPerformanceRepository.java  # 신규
│   └── PlaceDetailFacilityRepository.java     # 신규
├── service/
│   └── DataCollectionService.java          # Dual-write 패턴 적용
backend/src/main/resources/
├── logback-spring.xml                      # 로깅 설정 (신규)
└── db/data/init-seoul-places.sql           # 경로 이동

frontend/src/
├── components/
│   └── LocationSelectbox.tsx               # 2단계 위치 선택 컴포넌트 (신규)
├── data/
│   └── seoulDistricts.ts                   # 서울 120개 핫스팟 데이터 (신규)
└── pages/
    ├── ChatAppointment.tsx                 # selectbox 통합
    ├── LocationSetting.tsx                 # selectbox 통합
    └── DevConsole.tsx                      # selectbox 통합
```

---

## 🚀 v3.2 주요 업데이트 (2026.02.08)

### 1. 🔄 크로스 디바이스 온보딩 동기화 (Cross-Device Sync)
- **서버 기반 온보딩 상태 관리:**
  - `updateUserPreferences()` 호출 시 자동으로 `isOnboarded = true` 설정
  - 디바이스 변경 시에도 온보딩 완료 상태 유지
  - localStorage와 서버 상태 자동 동기화
- **RequireNewUser 가드 개선:**
  - 비동기로 서버에서 `isOnboarded` 상태 확인
  - `mbti` 또는 `soloLevel`이 설정되어 있으면 온보딩 완료로 간주 (기존 유저 호환)
- **SmartRedirect 개선:**
  - 401 인증 에러 시 토큰 삭제 후 로그인 페이지로 리다이렉트
  - 네트워크 에러 시 피드로 fallback (불필요한 온보딩 진입 방지)

### 2. 📋 미완료 약속 이어하기 시스템 (Pending Appointment Resume)
- **FeedPage 미완료 약속 배너:**
  - 진행 중인 약속이 있으면 상단에 배너 표시
  - 장소 미선택: "📍 장소 미선택" + "장소 선택" 버튼
  - 미션 미선택: "🎲 미션 미선택" + "미션 선택" 버튼
  - 모두 완료: "확인하기" 버튼
  - 약속 시간 및 장소 정보 표시
- **SmartRedirect 미완료 약속 처리:**
  - 장소/미션 미선택 약속은 피드로 리다이렉트
  - 피드 배너를 통해 이어서 진행 가능
  - 무한 로딩 방지

### 3. 🔙 약속 온보딩 뒤로가기 UX 개선
- **모든 온보딩 페이지에 뒤로가기 버튼 추가:**
  - LocationSetting: "나중에 할래" 버튼
  - TimePicker: "뒤로" 버튼
  - MissionList: "나중에 할래" 버튼
- **뒤로가기 시 동작:**
  - 토스트 메시지: "나중에 피드에서 이어할 수 있어요!"
  - 피드 페이지로 이동 (`replace: true`)
  - 약속은 그대로 유지 (미완료 상태)

### 4. 🛡️ 무한 로딩 방지 로직 개선
- **GlobalRedirectWrapper 예외 경로 확장:**
  - `/location`, `/time-picker` 추가
  - 약속 설정 플로우 중 리다이렉트 방지
- **약속 납치 로직 수정:**
  - `/location`, `/time-picker`는 약속 설정 플로우이므로 예외 처리
  - 채팅 온보딩(`/chat`, `/onboarding`)만 미션으로 납치

### 5. 💬 ChatAppointment 온보딩 간소화
- **진행 상태 저장 로직 완전 제거:**
  - `OnboardingProgress` 인터페이스 제거
  - `saveProgress`, `loadProgress`, `clearProgress` 함수 제거
  - 복잡한 상태 복원 로직 제거 (무한 로딩 원인)
- **뒤로가기 시 초기화:**
  - 브라우저/앱 뒤로가기: 토스트 + 홈으로 이동
  - 온보딩은 항상 처음부터 시작

### 6. 🔧 기술적 개선
- **백엔드 UserService:**
  - `updateUserPreferences()`에서 `completeOnboarding()` 자동 호출
  - 채팅 온보딩 완료 시 서버에 영속화
- **프론트엔드 타입 안전성:**
  - `Appointment` 타입에 `missionTitle` 필드 활용
  - Lucide React 아이콘 일관성 (ChevronLeft, MapPin, Calendar)

### 7. 📋 수정된 파일 목록
```
backend/src/main/java/com/littleescape/api/
└── service/UserService.java              # isOnboarded 자동 설정

frontend/src/
├── pages/
│   ├── FeedPage.tsx                      # 미완료 약속 배너 추가
│   ├── ChatAppointment.tsx               # 진행 저장 로직 제거, 뒤로가기 토스트
│   ├── LocationSetting.tsx               # 뒤로가기 버튼 추가
│   └── MissionList.tsx                   # 뒤로가기 버튼 추가
├── routes/RouteGuards.tsx                # 크로스 디바이스 동기화, 미완료 약속 처리
└── App.tsx                               # 예외 경로 확장
```

---

## 🎯 다음 개발 계획 (Roadmap)

### Phase 1: 피드 기능 고도화
- [x] 공개 피드 API 구현
- [x] 피드 페이지 실제 API 연동
- [x] 닉네임 마스킹 처리
- [ ] 피드 무한 스크롤 (Infinite Scroll)
- [ ] 피드 필터링 (카테고리별, 인기순, 최신순)
- [ ] 좋아요 기능 추가
- [ ] 사용자 프로필 페이지 및 팔로우 시스템

### Phase 2: 소셜 기능 확장
- [ ] 댓글 CRUD API 구현 및 연동
- [ ] 북마크 API 구현
- [ ] 미션 복사 API 구현
- [ ] 공유 기능 (카카오톡, 인스타그램)

### Phase 3: 알림 시스템
- [ ] 댓글 알림
- [ ] 북마크 알림
- [ ] 팔로워 활동 알림

### Phase 4: 성능 최적화
- [ ] 이미지 최적화 (WebP, 리사이징)
- [ ] 가상 스크롤 (Virtual Scroll)
- [ ] React Query 도입 (캐싱, 낙관적 업데이트)