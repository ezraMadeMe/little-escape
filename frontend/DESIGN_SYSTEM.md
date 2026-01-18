# 🎨 Little Escape Design System

## 브랜드 컨셉
**"시크한 다크 모드 + 강렬한 네온 포인트"**

우리는 혼자 놀기를 즐기는 1인 가구를 위한 서비스로, 츤데레 같은 시크한 매니저가 사용자를 케어하는 느낌을 전달합니다.

---

## 🎨 Color Palette

### Base Colors (다크 모드 배경)
```css
deep-charcoal: #121212      /* 메인 배경 */
charcoal-soft: #1A1A1A       /* 카드 배경 */
charcoal-lighter: #242424    /* 호버/구분선 */
```

### Brand Aliases (표준 명명)
```css
brand-dark: #121212          /* = deep-charcoal */
brand-gray: #1A1A1A          /* = charcoal-soft */
brand-neon: #CCFF00          /* = electric-lime */
brand-text: #EDEDED          /* = off-white */
brand-muted: #A0A0A0         /* = text-gray */
```

### Primary Colors (강렬한 네온)
```css
electric-lime: #CCFF00       /* 주요 액션 버튼 */
electric-lime-dark: #A3CC00  /* 호버 상태 */
neon-purple: #B026FF         /* 보조 액센트 */
neon-purple-dark: #8C1FCC    /* 호버 상태 */
```

### Text Colors
```css
off-white: #EDEDED           /* 기본 텍스트 */
text-gray: #A0A0A0           /* 보조 텍스트 */
text-gray-dark: #707070      /* 플레이스홀더 */
```

### Accent Colors
```css
accent-pink: #FF007A         /* 핑크 포인트 */
accent-cyan: #00F0FF         /* 시안 포인트 */
```

---

## 🧩 Component Classes

### 버튼 (Buttons)

#### 1. Primary CTA Button
```html
<button class="btn-primary">
  확인
</button>
```
- 용도: 주요 액션 (약속 생성, 미션 수락 등)
- 스타일: Electric Lime 배경, 검은 텍스트, 굵은 폰트

#### 2. CTA Button (각진 둥근 모서리)
```html
<button class="btn-cta">
  좋아, 나갈게
</button>
```
- 용도: 메인 화면의 대형 CTA
- 스타일: `rounded-xl` (12px), 더 큰 패딩, 그림자 효과

#### 3. Secondary Button
```html
<button class="btn-secondary">
  취소
</button>
```
- 용도: 보조 액션
- 스타일: Neon Purple 배경

#### 4. Ghost Button
```html
<button class="btn-ghost">
  오늘은 쉬어
</button>
```
- 용도: 비파괴적 액션, 거절 등
- 스타일: 배경 없음, 텍스트만

---

### 카드 (Cards)

#### 1. Standard Card
```html
<div class="card">
  <!-- 콘텐츠 -->
</div>
```
- 용도: 일반 콘텐츠 카드
- 스타일: `bg-charcoal-soft`, `rounded-solotion` (12px), 호버 시 네온 테두리

#### 2. Mission Card
```html
<div class="mission-card">
  <img src="..." alt="미션 이미지" />
  <div class="p-6">
    <h3>미션 제목</h3>
    <p>미션 설명</p>
  </div>
</div>
```
- 용도: 미션/장소 카드
- 스타일: `rounded-2xl` (16px), 그림자, 호버 효과

---

### 입력 필드 (Inputs)

```html
<input type="text" class="input" placeholder="닉네임 입력..." />
```
- 스타일: 다크 배경, 네온 포커스 링

---

### 내비게이션 바 (Navigation)

```html
<nav class="nav-glass">
  <!-- 네비게이션 아이템 -->
</nav>
```
- 용도: 하단 고정 네비게이션, 헤더
- 스타일: Glassmorphism (반투명 + 블러)

---

## 📐 Layout Utilities

### 컨테이너
```html
<div class="container-solotion">
  <!-- 최대 너비 제한된 콘텐츠 -->
</div>
```
- 최대 너비: `max-w-6xl`
- 자동 중앙 정렬, 좌우 패딩

### 스크롤바
```html
<div class="scrollbar-solotion overflow-y-auto">
  <!-- 스크롤 가능한 콘텐츠 -->
</div>
```
- 커스텀 스타일 스크롤바 (다크 모드)

---

## ✨ Special Effects

### 네온 텍스트
```html
<p class="text-neon">강조할 텍스트</p>
```
- Electric Lime 색상 + 글로우 효과

### 클릭 가능 아이템
```html
<div class="clickable">
  <!-- 호버/클릭 시 스케일 애니메이션 -->
</div>
```

---

## 🎭 Typography

### 헤딩
- `h1`: `text-4xl font-extra-bold` (36px, 800 weight)
- `h2`: `text-3xl font-bold` (30px, 700 weight)
- `h3`: `text-2xl font-bold` (24px, 700 weight)

### 본문
- 기본: `text-text-gray leading-relaxed`
- 강조: `text-off-white font-semibold`

### 링크
- 자동 스타일: Electric Lime + 호버 다크닝

---

## 📏 Border Radius

```css
rounded-solotion-sm: 8px    /* 작은 요소 */
rounded-solotion: 12px       /* 기본 (버튼, 카드) */
rounded-solotion-lg: 16px    /* 큰 요소 */
rounded-xl: 12px             /* CTA 버튼 */
rounded-2xl: 16px            /* 미션 카드 */
```

---

## 🌟 Best Practices

### ✅ DO
- 모든 메인 CTA는 `btn-cta` 또는 `btn-primary` 사용
- 카드는 `card` 또는 `mission-card` 클래스 사용
- 하단 네비게이션은 `nav-glass` 적용
- 텍스트는 기본 `text-gray`, 강조는 `text-off-white`

### ❌ DON'T
- 임의의 컬러 코드 직접 입력 금지
- 인라인 스타일 최소화
- 버튼에 `bg-blue-500` 같은 Tailwind 기본 색상 사용 금지
- 각 페이지마다 다른 스타일 적용 금지

---

## 🚀 Quick Reference

### 주요 컬러 사용 예시
```html
<!-- 배경 -->
<body class="bg-brand-dark">
<div class="bg-brand-gray">

<!-- 텍스트 -->
<p class="text-brand-text">일반 텍스트</p>
<p class="text-brand-muted">보조 텍스트</p>
<p class="text-brand-neon">강조 텍스트</p>

<!-- 버튼 -->
<button class="bg-brand-neon text-black">액션</button>
```

---

## 📞 Contact
디자인 시스템 관련 질문이나 제안은 팀 슬랙 채널에서 논의해주세요.

**마지막 업데이트**: 2026-01-18
