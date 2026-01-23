# 약속 자동 만료 처리 스케줄러

## 개요
예정 시간(`scheduledAt`)으로부터 24시간이 경과했는데도 도착 인증을 하지 않은 약속을 자동으로 `EXPIRED` 상태로 변경하는 스케줄러입니다.

## 구현 내용

### 1. AppointmentStatus 추가
- **파일**: `domain/type/AppointmentStatus.java`
- **추가된 상태**: `EXPIRED` - 만료됨 (24시간 경과 후 도착 인증 없음)

### 2. AppointmentRepository 배치 업데이트 쿼리
- **파일**: `repository/AppointmentRepository.java`
- **메서드**: `updateExpiredAppointments()`
- **기능**: 대량 업데이트를 위한 `@Modifying` JPQL 쿼리

```java
@Modifying
@Query("UPDATE Appointment a SET a.status = :newStatus " +
       "WHERE a.status IN :currentStatuses " +
       "AND a.scheduledAt < :expirationTime")
int updateExpiredAppointments(
    @Param("newStatus") AppointmentStatus newStatus,
    @Param("currentStatuses") List<AppointmentStatus> currentStatuses,
    @Param("expirationTime") LocalDateTime expirationTime
);
```

### 3. AppointmentScheduler
- **파일**: `scheduler/AppointmentScheduler.java`
- **실행 주기**: 매 시간 정각 (Cron: `0 0 * * * *`)
- **처리 대상**:
  - 상태: `PENDING`, `ACCEPTED`, `UNLOCKED`
  - 시간: `scheduledAt < (현재 시간 - 24시간)`

## 실행 로직

```
1. 현재 시간(KST) 기준 24시간 전 계산
2. 대상 상태(PENDING, ACCEPTED, UNLOCKED) 정의
3. JPA 배치 업데이트 실행
4. 로그 출력: "✅ 약속 만료 처리 완료: N건의 약속이 EXPIRED 상태로 변경됨"
```

## 로그 예시

### 정상 실행
```
🕐 약속 만료 체크 시작: 기준 시간 [2026-01-21T10:00:00] 이전의 미도착 약속 검색
✅ 약속 만료 처리 완료: 3건의 약속이 EXPIRED 상태로 변경됨
```

### 만료 대상 없음
```
🕐 약속 만료 체크 시작: 기준 시간 [2026-01-21T10:00:00] 이전의 미도착 약속 검색
📭 만료 대상 약속 없음
```

### 오류 발생
```
🕐 약속 만료 체크 시작: 기준 시간 [2026-01-21T10:00:00] 이전의 미도착 약속 검색
❌ 약속 만료 체크 중 오류 발생: Connection timeout
```

## 테스트 방법

### 1. 단위 테스트 (권장)
```java
@Test
void testExpiredAppointments() {
    // Given: 24시간 이상 경과한 약속 생성
    Appointment appointment = Appointment.builder()
        .scheduledAt(LocalDateTime.now().minusHours(25))
        .status(AppointmentStatus.PENDING)
        .build();
    appointmentRepository.save(appointment);

    // When: 스케줄러 실행
    appointmentScheduler.checkExpiredAppointments();

    // Then: EXPIRED 상태로 변경 확인
    Appointment updated = appointmentRepository.findById(appointment.getId()).get();
    assertEquals(AppointmentStatus.EXPIRED, updated.getStatus());
}
```

### 2. 로컬 테스트 (1분 주기)
`AppointmentScheduler.java`의 테스트 메서드 주석 해제:

```java
@Transactional
@Scheduled(cron = "0 * * * * *") // 1분마다 실행
public void checkExpiredAppointmentsTest() {
    log.info("🧪 [TEST] 약속 만료 체크 (1분 주기)");
    checkExpiredAppointments();
}
```

### 3. 수동 API 호출 (개발 전용)
만약 수동 트리거가 필요하면 컨트롤러 추가:

```java
@RestController
@RequestMapping("/api/admin/scheduler")
public class SchedulerController {

    @PostMapping("/check-expired")
    public ResponseEntity<String> triggerExpiredCheck() {
        appointmentScheduler.checkExpiredAppointments();
        return ResponseEntity.ok("Expired check triggered");
    }
}
```

## 성능 최적화

### 배치 업데이트 사용
- `@Modifying` + JPQL로 대량 업데이트 실행
- N+1 문제 방지
- 단일 쿼리로 여러 레코드 동시 처리

### 트랜잭션 관리
- `@Transactional` 사용으로 원자성 보장
- 실패 시 자동 롤백

## 모니터링

### 주요 지표
1. **처리 건수**: 시간당 만료 처리된 약속 수
2. **실행 시간**: 스케줄러 실행 소요 시간
3. **오류 발생**: 스케줄러 실행 중 예외 발생 여부

### 알림 설정 (선택)
- Slack/Discord 웹훅으로 만료 처리 건수 알림
- 에러 발생 시 즉시 알림

## 운영 체크리스트

- [ ] `@EnableScheduling` 활성화 확인
- [ ] 타임존 설정 확인 (`Asia/Seoul`)
- [ ] 로그 레벨 설정 (INFO 이상)
- [ ] 데이터베이스 인덱스 확인 (`scheduledAt`, `status`)
- [ ] 배치 업데이트 성능 모니터링

## 참고사항

### 상태 전이 다이어그램
```
PENDING/ACCEPTED/UNLOCKED
    |
    | (scheduledAt + 24시간 경과)
    ↓
  EXPIRED
```

### 관련 파일
- `AppointmentStatus.java`: 상태 enum 정의
- `AppointmentRepository.java`: 배치 업데이트 쿼리
- `AppointmentScheduler.java`: 스케줄러 로직
- `BackendApplication.java`: `@EnableScheduling` 설정
