# 🌿 Little Escape (작은 일탈)

바쁜 현대인을 위한 일상 속 작은 휴식 제안 서비스

## 🚀 주요 기능 (v1.0 Updates)

### 1. 인증 & 계정
- **소셜 로그인:** Google, Kakao 로그인 지원 (OAuth2)
- **매직 링크:** 비밀번호 없이 SMS로 전송된 링크 클릭 한 번으로 로그인
- **친구 초대:** SMS를 통해 지인에게 서비스 초대장 발송

### 2. 미션 & 약속 관리
- **미션 수행:** 랜덤 미션 배정 및 장소 추천
- **약속 관리:** 약속 생성, 수행 인증(사진), 취소 관리
- **다시 지키러 가기:** 취소된 약속을 손쉽게 다시 잡는 복제 기능
- **월간 리포트:** 매월 1일, 지난달의 활동 기록을 이메일로 리포팅

### 3. UI/UX
- **인스타그램 스타일 피드:** 직관적인 카드 UI와 이미지 슬라이더
- **반응형 디자인:** 모바일 환경에 최적화된 레이아웃

---

## 🛠 기술 스택 (Tech Stack)

- **Backend:** Java 17, Spring Boot 3.x, JPA/Hibernate, MySQL
- **Frontend:** React, TypeScript, Tailwind CSS, React-slick
- **Infra/DevOps:** Docker, Ngrok (Dev Tunneling)
- **External APIs:**
  - CoolSMS (SMS 발송)
  - Google/Kakao OAuth
  - Kakao Maps API

---

## ⚙️ 환경 설정 (Environment Setup)

### 1. 필수 환경 변수 (.env / application.yml)
서비스 실행을 위해 아래 키 값이 필요합니다.

\`\`\`properties
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
\`\`\`

### 2. 모바일 테스트 가이드 (Ngrok)
모바일 기기에서 접속하거나 소셜 로그인을 테스트하려면 Ngrok 설정이 필요합니다.

1. Ngrok 실행: `ngrok http 8080`
2. 생성된 HTTPS URL을 `.env`의 `VITE_API_BASE_URL`에 등록
3. Google Cloud Console에서 리다이렉트 URI에 Ngrok 주소 추가



## 🚀 v1.1 주요 업데이트 (2026.01.11)

### 1. 🕒 상황별 맞춤 미션 추천
- 사용자가 선택한 **약속 시간**과 **날씨(예정)**를 분석하여 최적의 미션을 제안합니다.
- **아침(Morning):** 상쾌한 시작을 위한 활동 추천
- **밤(Night):** 감성적이고 차분한 장소 추천
- **실내/실외:** 날씨 및 상황에 맞는 장소 타입 필터링

### 2. 📸 감성 미션 인증 (Mission Proof)
- **다중 이미지 슬라이더:** 여러 장의 추억을 인스타그램 피드처럼 슬라이드로 기록합니다.
- **키워드 리뷰:** 긴 글 대신 "🌿 힐링돼요", "🔥 뿌듯해요" 같은 감성 태그로 직관적인 후기를 남깁니다.

### 3. 🎨 UI/UX 리뉴얼
- **피드형 마이페이지:** 카드 간 여백을 제거하여 몰입감 있는 기록 보관함 형태로 변경했습니다.
- **스마트 액션:** 약속 시간이 되면 자동으로 '인증하기' 버튼이 활성화됩니다.
- **Revenge 기능:** 취소했던 약속을 버튼 하나로 손쉽게 다시 잡을 수 있습니다.

---

## 🛠 기술적 개선 사항 (Technical Improvements)

### 📤 파일 업로드 및 이미지 처리
- **Multipart/FormData & JSON 혼합 전송:** 복잡한 DTO와 다중 파일을 하나의 요청으로 처리하는 안정적인 구조 구현.
- **로컬 스토리지 전략:** 개발 환경 편의를 위해 서버 내부 `uploads/` 폴더 자동 생성 및 매핑 로직 적용.
- **이미지 슬라이더:** `react-slick`을 커스텀하여 모바일 터치 친화적인 슬라이더 구현.

### 🌏 Timezone & Data Integrity
- **KST 표준화:** 프론트엔드와 백엔드 간의 시간 오차(UTC vs KST)를 제거하기 위해 데이터 전송 포맷을 통일하고 서버 타임존을 고정했습니다.
