# Little Escape Frontend

Vite + React + TypeScript 기반 프론트엔드 애플리케이션입니다.

## 기술 스택

- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.14

## 패키지 매니저

이 프로젝트는 **npm**을 패키지 매니저로 사용합니다.

## 설치 및 실행

### 의존성 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm run build
```

### 빌드 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
frontend/
├── public/              # 정적 파일
├── src/
│   ├── api/            # API 클라이언트
│   │   ├── client.ts           # Axios 인스턴스
│   │   ├── appointmentApi.ts   # 약속 API
│   │   ├── missionApi.ts       # 미션 API
│   │   └── userApi.ts          # 사용자 API
│   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── ActionChips.tsx           # 약속 액션 칩
│   │   ├── ChatActionArea.tsx        # 채팅 액션 영역
│   │   ├── CommentBottomSheet.tsx    # 댓글 바텀시트
│   │   ├── EditActionChips.tsx       # 편집 액션 칩
│   │   ├── FeaturedCard.tsx          # 피처드 카드
│   │   ├── Header.tsx                # 헤더
│   │   ├── LocationPicker.tsx        # 위치 선택기
│   │   ├── MissionCard.tsx           # 미션 카드
│   │   └── SmartActionModal.tsx      # 스마트 액션 모달
│   ├── hooks/          # 커스텀 훅
│   │   └── useNextAppointment.ts     # 다음 약속 훅
│   ├── layouts/        # 레이아웃 컴포넌트
│   │   └── MainLayout.tsx            # 메인 레이아웃
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── Appointments.tsx          # 약속 리스트
│   │   ├── AuthCallback.tsx          # 인증 콜백
│   │   ├── ChatAppointment.tsx       # 채팅형 약속 생성
│   │   ├── Contact.tsx               # 연락처
│   │   ├── Feed.tsx                  # 피드 (레거시)
│   │   ├── FeedPage.tsx              # 피드 페이지 (v2.1)
│   │   ├── LoginPage.tsx             # 로그인
│   │   ├── MagicLogin.tsx            # 매직 링크 로그인
│   │   ├── MissionDetail.tsx         # 미션 상세
│   │   ├── MissionList.tsx           # 미션 리스트
│   │   ├── MissionProof.tsx          # 미션 인증
│   │   ├── MyPage.tsx                # 마이페이지
│   │   ├── OAuthCallback.tsx         # OAuth 콜백
│   │   ├── Onboarding.tsx            # 온보딩
│   │   ├── PickMission.tsx           # 미션 선택
│   │   ├── ProfileEdit.tsx           # 프로필 편집
│   │   └── Reviews.tsx               # 리뷰
│   ├── types/          # TypeScript 타입 정의
│   │   ├── appointment.ts            # 약속 타입
│   │   ├── feed.ts                   # 피드 타입 (v2.1)
│   │   ├── mission.ts                # 미션 타입
│   │   └── user.ts                   # 사용자 타입
│   ├── utils/          # 유틸리티 함수
│   │   └── dateUtils.ts              # 날짜 유틸
│   ├── App.tsx         # 메인 앱 컴포넌트
│   ├── main.tsx        # 진입점
│   ├── App.css         # 앱 스타일
│   └── index.css       # 전역 스타일
├── index.html          # HTML 템플릿
├── package.json        # 프로젝트 설정
├── tsconfig.json       # TypeScript 설정
├── tailwind.config.js  # Tailwind CSS 설정
├── postcss.config.js   # PostCSS 설정
└── vite.config.ts      # Vite 설정
```

## 주요 기능

### 1. 소셜 피드 (v2.1)
- **FeedPage**: 다른 사용자들의 미션 완료 인증 피드
- **CommentBottomSheet**: 댓글 및 답글 작성 UI
- **북마크 & 댓글**: 실시간 상호작용 기능

### 2. 채팅형 약속 생성 (v2.0)
- **ChatAppointment**: 봇과의 대화를 통한 약속 생성
- **LocationPicker**: GPS 기반 위치 선택
- **시간/장소/미션 단계별 선택**

### 3. 약속 관리 (v1.2)
- **Appointments**: 약속 리스트 및 관리
- **스와이프 액션**: 삭제/복제 제스처
- **Smart FAB**: 다가오는 약속 실시간 표시

### 4. 인증 & 온보딩
- **OAuth 소셜 로그인** (Google, Kakao)
- **매직 링크 로그인** (SMS)
- **단계별 온보딩** (닉네임, 프로필, 전화번호)

## 의존성

### 주요 라이브러리
- **react**: ^18.3.1 - UI 라이브러리
- **react-router-dom**: ^7.12.0 - 라우팅
- **axios**: ^1.7.9 - HTTP 클라이언트
- **zustand**: ^5.0.3 - 상태 관리
- **tailwindcss**: ^3.4.14 - CSS 프레임워크
- **framer-motion**: ^12.25.0 - 애니메이션
- **date-fns**: ^4.1.0 - 날짜 유틸리티
- **lucide-react**: ^0.562.0 - 아이콘 라이브러리 (v2.1)
- **react-slick**: ^0.30.2 - 이미지 슬라이더

## 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

## 개발 가이드

### 모바일 테스트
```bash
# 로컬 네트워크에서 접근 가능하도록 실행
npm run dev -- --host
```

### 타입 체크
```bash
npx tsc --noEmit
```

### 린트
```bash
npx eslint src/
```
