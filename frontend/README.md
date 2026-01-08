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
├── public/          # 정적 파일
├── src/
│   ├── App.tsx      # 메인 앱 컴포넌트
│   ├── main.tsx     # 진입점
│   ├── App.css      # 앱 스타일
│   └── index.css    # 전역 스타일
├── index.html       # HTML 템플릿
├── package.json     # 프로젝트 설정
├── tsconfig.json    # TypeScript 설정
└── vite.config.ts   # Vite 설정
```
