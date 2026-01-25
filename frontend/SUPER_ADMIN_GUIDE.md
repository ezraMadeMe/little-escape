# 🔓 Super Admin 모드 사용 가이드

ngrok 무료 버전에서 하나의 포트만 사용 가능한 상황에서, 백엔드 없이 프론트엔드 전체 플로우를 테스트할 수 있는 개발자 모드입니다.

## 🚀 빠른 시작

### 1. Super Admin 버튼으로 로그인

1. 로그인 페이지(`/login`)로 이동
2. 화면 하단에 보라색 **"🔓 Super Admin (개발 전용)"** 버튼 클릭
3. 자동으로 Mock 토큰이 생성되고 피드 페이지로 이동

### 2. Mock 모드 확인

브라우저 콘솔에서 다음 메시지 확인:
```
🔓 Super Admin 모드 활성화
✅ Mock 토큰 설정 완료
  - token: mock-dev-token-1234567890
  - onboarding_complete: true
```

API 호출 시마다:
```
🎭 Mock 모드 활성화 - 백엔드 요청 우회
🎭 Mock API Request: /api/v1/appointments/feed GET
```

## 📱 사용 가능한 기능

### ✅ 완전 지원 (Mock 데이터)
- **피드 조회**: 20개의 Mock 피드 아이템 표시
- **내 약속 조회**: 진행 중 1개, 완료된 2개 약속
- **약속 상세 조회**: 랜덤 Mock 데이터 생성
- **유저 정보**: Super Admin 프로필
- **다음 약속 확인**: 진행 중인 약속 반환

### ⚠️ 제한적 지원
- **약속 생성/수정/삭제**: 성공 응답만 반환 (실제 저장 안 됨)
- **좋아요/저장**: 성공 응답만 반환 (상태 변경 안 됨)
- **댓글**: 빈 배열 반환

### ❌ 미지원
- **이미지 업로드**: 백엔드 필요
- **실시간 데이터 동기화**: localStorage 기반
- **OAuth 로그인**: Mock 토큰 사용

## 🛠️ 고급 사용법

### Mock 데이터 커스터마이징

`frontend/src/utils/mockData.ts` 파일에서 Mock 데이터 수정 가능:

```typescript
// Mock 피드 개수 변경
export const createMockFeeds = (count: number = 20) => { ... }

// Mock 약속 데이터 커스터마이징
const mockAppointment = createMockAppointment({
  missionTitle: '나만의 미션',
  placeName: '나만의 장소',
  rating: 5.0,
});
```

### Mock 모드 수동 활성화

콘솔에서 직접 활성화:
```javascript
localStorage.setItem('token', 'mock-dev-token-' + Date.now());
localStorage.setItem('onboarding_complete', 'true');
localStorage.setItem('mock_user', JSON.stringify({
  id: 999,
  nickname: 'Custom Admin',
  email: 'custom@solotion.dev',
  isOnboarded: true
}));
location.href = '/feed';
```

### Mock 모드 비활성화

```javascript
localStorage.clear();
location.reload();
```

## 🎯 테스트 시나리오

### 1. 신규 유저 플로우
```
1. Super Admin 로그인
2. /feed 접근 → Mock 피드 20개 표시
3. 피드 카드 클릭 → Mock 상세 정보
4. 좋아요/저장 → 성공 응답 (UI만 업데이트)
```

### 2. 진행 중인 약속 플로우
```
1. Super Admin 로그인
2. /appointments 접근 → 진행 중 약속 1개 표시
3. Featured Card 클릭 → /mission/:id 이동
4. Mock 미션 데이터 표시
```

### 3. 완료된 약속 조회
```
1. Super Admin 로그인
2. /appointments 접근
3. "완료" 탭 선택 → 완료된 약속 2개 표시
4. 약속 카드 클릭 → /archived/:id 이동
5. Mock 아카이브 데이터 표시
```

## 🔧 트러블슈팅

### Q: Super Admin 버튼이 안 보여요
A: 개발 환경에서만 표시됩니다. `npm run dev`로 실행했는지 확인하세요.

### Q: API 에러가 발생해요
A: Mock 모드가 제대로 활성화되지 않았습니다. 콘솔에서 다음 확인:
```javascript
localStorage.getItem('token') // mock-dev-token으로 시작해야 함
```

### Q: 이미지 업로드가 안 돼요
A: Mock 모드에서는 이미지 업로드가 지원되지 않습니다. 백엔드 연결이 필요합니다.

### Q: 데이터가 저장 안 돼요
A: Mock 모드는 localStorage 기반이므로:
- 페이지 새로고침 시 Mock 데이터로 초기화
- 실제 저장은 되지 않음
- 백엔드 연결 시에만 실제 저장 가능

## 📝 Mock API 엔드포인트

현재 지원하는 Mock 엔드포인트:

| 엔드포인트 | Method | Mock 응답 |
|-----------|--------|----------|
| `/api/v1/users/me` | GET | Super Admin 유저 정보 |
| `/api/v1/appointments/feed` | GET | 20개 Mock 피드 |
| `/api/v1/appointments/my` | GET | 3개 Mock 약속 (진행중 1, 완료 2) |
| `/api/v1/appointments/next` | GET | 진행 중인 Mock 약속 |
| `/api/v1/appointments/:id/detail` | GET | Mock 약속 상세 |
| `/api/v1/appointments/saved` | GET | 빈 배열 |
| `/api/v1/appointments` | POST | Mock 약속 생성 |
| `*` | PATCH/DELETE | 성공 응답 (undefined) |

## 🎨 UI 커스터마이징

Super Admin 버튼 스타일 변경 (`LoginPage.tsx:170-178`):
```tsx
<button
  onClick={handleSuperAdminLogin}
  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 ..."
>
  🔓 Super Admin (개발 전용)
</button>
```

## 🚀 프로덕션 배포

Super Admin 버튼은 `import.meta.env.DEV`로 감싸져 있어 프로덕션 빌드에서는 자동으로 제거됩니다.

```bash
npm run build  # Super Admin 버튼 자동 제거됨
```

## 💡 팁

1. **ngrok 1포트로 충분**: 프론트엔드(5173)만 ngrok으로 열면 됨
2. **빠른 플로우 테스트**: 백엔드 없이 전체 UI/UX 확인 가능
3. **모바일 테스트**: ngrok HTTPS URL로 실제 디바이스 테스트
4. **디버깅**: 콘솔에서 🎭 이모지로 Mock 요청 쉽게 식별

## 📞 문의

Mock 모드 관련 이슈나 개선 사항은 개발팀에 문의하세요.
