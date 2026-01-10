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
