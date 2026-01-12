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

## 🛠 기술적 해결 사례 (Technical Challenges)

### 🔐 OAuth2 & Data Integrity
- **Null Safety:** 소셜 로그인 시 이메일 정보가 없는 경우(Kakao 등) 발생하던 서버 에러를 방어 코드로 해결하고, 식별 체계를 `Email`에서 `Phone Number` + `Social ID` 조합으로 변경했습니다.
- **Unique Constraint:** 중복 회원 생성을 방지하기 위해 DB 레벨에서 강력한 유니크 제약 조건을 설정하고, 예외 처리를 통해 데이터 무결성을 확보했습니다.

### 🖼️ UI/UX Optimization
- **Swipe Interactions:** 모바일 웹에서도 네이티브 앱처럼 부드러운 스와이프 경험을 제공하기 위해 터치 이벤트 핸들링을 최적화했습니다.
- **Dynamic Routing:** 사용자의 `Role`(Guest vs User)에 따라 온보딩 페이지와 메인 페이지로 자동 분기되는 스마트 라우팅을 구현했습니다.