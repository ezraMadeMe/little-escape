# 약속 만료 스케줄러 테스트 가이드

## 문제 상황
EXPIRED 상태로 변경이 안 되는 경우 확인 사항

## 체크리스트

### 1. 스케줄러 활성화 확인
```java
// BackendApplication.java
@EnableScheduling  // ✅ 이 어노테이션이 있는지 확인
@SpringBootApplication
public class BackendApplication {
    ...
}
```

### 2. 테스트용 스케줄러 활성화
현재 설정:
- `checkExpiredAppointmentsTest()` - **활성화됨** (1분마다 실행)
- `checkExpiredAppointments()` - 비활성화됨 (매 시간 실행)

### 3. 데이터베이스 확인

#### 3.1 약속 데이터 확인
```sql
-- 만료 대상 확인
SELECT
    id,
    status,
    scheduled_at,
    mission_title,
    place_name,
    TIMESTAMPDIFF(HOUR, scheduled_at, NOW()) as hours_passed
FROM appointments
WHERE status IN ('PENDING', 'ACCEPTED', 'UNLOCKED')
AND scheduled_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

#### 3.2 EXPIRED 상태 확인
```sql
-- EXPIRED 상태 약속 확인
SELECT
    id,
    status,
    scheduled_at,
    mission_title,
    place_name,
    updated_at
FROM appointments
WHERE status = 'EXPIRED'
ORDER BY updated_at DESC;
```

### 4. 수동 실행 방법

#### 방법 1: API 호출 (권장)
```bash
# 약속 만료 체크 수동 실행
curl -X POST http://localhost:8080/api/admin/scheduler/check-expired
```

응답 예시:
```json
{
  "success": true,
  "message": "약속 만료 체크가 완료되었습니다. 로그를 확인해주세요."
}
```

#### 방법 2: 서버 재시작
- 테스트용 스케줄러가 활성화되어 있으므로
- 서버 시작 후 1분 이내에 자동 실행됨

## 로그 확인

### 정상 실행 로그
```
🧪 [TEST] 약속 만료 체크 (1분 주기) 시작
🕐 약속 만료 체크 시작
   - 현재 시간(KST): 2026-01-22T15:30:00
   - 만료 기준 시간: 2026-01-21T15:30:00 이전
   - 대상 상태: [PENDING, ACCEPTED, UNLOCKED]
✅ 약속 만료 처리 완료: 3건의 약속이 EXPIRED 상태로 변경됨
```

### 대상 없음 로그
```
🧪 [TEST] 약속 만료 체크 (1분 주기) 시작
🕐 약속 만료 체크 시작
   - 현재 시간(KST): 2026-01-22T15:30:00
   - 만료 기준 시간: 2026-01-21T15:30:00 이전
   - 대상 상태: [PENDING, ACCEPTED, UNLOCKED]
📭 만료 대상 약속 없음 (조건에 맞는 약속이 없거나 이미 처리됨)
```

### 오류 발생 로그
```
❌ 약속 만료 체크 중 오류 발생: ...
```

## 트러블슈팅

### 문제 1: 스케줄러가 실행되지 않음
**증상**: 1분이 지나도 로그가 안 찍힘

**해결**:
1. `@EnableScheduling` 확인
2. `AppointmentScheduler` 클래스에 `@Component` 확인
3. 서버 재시작

### 문제 2: 대상이 있는데 업데이트가 안 됨
**증상**: 로그에 "0건 처리" 또는 "대상 없음" 표시

**원인**:
1. 상태가 `PENDING`, `ACCEPTED`, `UNLOCKED`가 아님
2. `scheduledAt`이 24시간이 안 지남
3. 트랜잭션 문제

**해결**:
```sql
-- 상태 확인
SELECT status, COUNT(*)
FROM appointments
WHERE scheduled_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY status;

-- 수동으로 상태 변경 (테스트용)
UPDATE appointments
SET status = 'EXPIRED'
WHERE id = 123;  -- 특정 약속 ID
```

### 문제 3: `@Modifying` 쿼리 실행 안 됨
**증상**: 로그는 정상인데 DB에 반영 안 됨

**해결**:
```java
// AppointmentScheduler.java
@Transactional  // ✅ 이 어노테이션 확인
@Scheduled(cron = "0 * * * * *")
public void checkExpiredAppointmentsTest() {
    ...
}
```

## 테스트 시나리오

### 시나리오 1: 24시간 지난 약속 만료
```sql
-- 1. 테스트 데이터 생성 (25시간 전)
INSERT INTO appointments (
    user_id, status, scheduled_at,
    mission_title, place_name, created_at, updated_at
) VALUES (
    1, 'PENDING', DATE_SUB(NOW(), INTERVAL 25 HOUR),
    '테스트 미션', '테스트 장소', NOW(), NOW()
);

-- 2. API 호출 또는 1분 대기

-- 3. 결과 확인
SELECT * FROM appointments WHERE id = LAST_INSERT_ID();
-- status가 'EXPIRED'로 변경되어야 함
```

### 시나리오 2: 도착 인증한 약속은 제외
```sql
-- 1. ARRIVED 상태 약속 생성 (25시간 전)
INSERT INTO appointments (
    user_id, status, scheduled_at,
    mission_title, place_name, created_at, updated_at
) VALUES (
    1, 'ARRIVED', DATE_SUB(NOW(), INTERVAL 25 HOUR),
    '도착한 미션', '도착한 장소', NOW(), NOW()
);

-- 2. 스케줄러 실행

-- 3. 결과 확인
SELECT * FROM appointments WHERE id = LAST_INSERT_ID();
-- status가 여전히 'ARRIVED'여야 함 (변경되지 않음)
```

## 운영 배포 시

테스트용 스케줄러를 비활성화하고 운영용 활성화:

```java
// AppointmentScheduler.java

// 운영용 (매 시간 정각)
@Transactional
@Scheduled(cron = "0 0 * * * *")
public void checkExpiredAppointments() {
    ...
}

// 테스트용 (주석 처리)
// @Transactional
// @Scheduled(cron = "0 * * * * *")
// public void checkExpiredAppointmentsTest() {
//     ...
// }
```

## 모니터링

### 매일 확인할 지표
```sql
-- 오늘 만료된 약속 수
SELECT COUNT(*)
FROM appointments
WHERE status = 'EXPIRED'
AND DATE(updated_at) = CURDATE();

-- 만료 대기 중인 약속 (24시간 이내)
SELECT COUNT(*)
FROM appointments
WHERE status IN ('PENDING', 'ACCEPTED', 'UNLOCKED')
AND scheduled_at BETWEEN DATE_SUB(NOW(), INTERVAL 48 HOUR)
                     AND DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

## 참고

- 스케줄러 코드: `backend/src/main/java/com/littleescape/api/scheduler/AppointmentScheduler.java`
- 리포지토리 쿼리: `backend/src/main/java/com/littleescape/api/repository/AppointmentRepository.java`
- Admin API: `POST /api/admin/scheduler/check-expired`
