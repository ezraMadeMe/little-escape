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