# ⚡️ Quick Start Guide - 피드 기능

## ✅ 현재 상태
- Backend: 실행 중 ✅
- Frontend: 실행 중 ✅
- Feed API: 동작 확인 ✅
- 데이터: 없음 (추가 필요) ⚠️

## 🚀 테스트 데이터 추가하기

### 1단계: Supabase SQL Editor 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭

### 2단계: SQL 실행
아래 SQL을 복사하여 실행:

```sql
-- 완료된 약속 중 인증샷이 있는 것을 공개로 설정
UPDATE appointments
SET is_public = true,
    completed_at = COALESCE(completed_at, updated_at)
WHERE status = 'COMPLETED'
  AND (proof_image_url IS NOT NULL OR array_length(proof_image_urls, 1) > 0)
  AND is_public = false
LIMIT 10;
```

### 3단계: 결과 확인
```sql
SELECT COUNT(*) as public_feed_count
FROM appointments
WHERE is_public = true AND status = 'COMPLETED';
```

## 📱 Frontend 테스트

### 브라우저에서 확인
1. http://localhost:5173 접속
2. 로그인
3. 홈(피드) 화면에서 공개된 인증샷 확인

### 예상 화면
- 공개된 완료 약속들이 카드 형태로 표시됨
- 각 카드에는:
  - 닉네임 (마스킹 처리)
  - 미션 제목
  - 장소명
  - 인증샷 이미지
  - 댓글
  - 리뷰 키워드
  - 완료 시간 (상대 시간)

## 🔧 문제 해결

### Feed에 데이터가 안 보이면?

1. **Backend 로그 확인**
   ```bash
   tail -f /tmp/backend-restart.log | grep "피드"
   ```

2. **API 직접 테스트**
   ```bash
   curl "http://localhost:8080/api/v1/appointments/feed?page=0&size=20"
   ```
   - 빈 배열 `[]`: 공개 데이터 없음 → SQL 다시 실행
   - JSON 데이터: 정상 → Frontend 새로고침

3. **데이터베이스 확인**
   ```sql
   SELECT COUNT(*)
   FROM appointments
   WHERE status = 'COMPLETED'
     AND is_public = true
     AND (proof_image_url IS NOT NULL OR array_length(proof_image_urls, 1) > 0);
   ```

### Backend 재시작이 필요하면?
```bash
# 현재 프로세스 종료
pkill -f "BackendApplication"

# 재시작
cd backend && ./gradlew bootRun
```

### Frontend 재시작이 필요하면?
```bash
cd frontend && npm run dev
```

## 📋 주요 변경사항 요약

### SecurityConfig.java
```java
// 이 줄이 추가됨 (Line 46)
.requestMatchers("/api/v1/appointments/feed").permitAll()
```

이 변경으로 인증 없이 피드 API에 접근 가능합니다.

## 🎯 다음 단계

1. ✅ Supabase에서 SQL 실행
2. ✅ Frontend에서 피드 확인
3. ✅ 스마트 네비게이션 테스트
4. ✅ 페이지네이션 테스트

---

**Ready to test!** 🚀

위 SQL을 실행하면 바로 피드 기능을 테스트할 수 있습니다!
