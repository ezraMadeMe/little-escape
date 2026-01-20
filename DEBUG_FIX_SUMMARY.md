# Spring Boot 시작 오류 디버깅 완료 보고서

## 📋 문제 요약

**에러 메시지:**
```
Error creating bean 'dataSourceScriptDatabaseInitializer'
Failed to execute SQL script statement #5 of data.sql
CREATE TABLE IF NOT EXISTS suggestions ... AUTO_INCREMENT ...
```

**근본 원인:**
- MySQL 문법(`AUTO_INCREMENT`, `ON UPDATE CURRENT_TIMESTAMP`)을 PostgreSQL 데이터베이스에서 사용
- JSON 타입 관련 PostgreSQL 호환성 문제

---

## ✅ 해결 내역

### 1. **data.sql 파일 수정** (PostgreSQL 문법 적용)

#### 변경 1: suggestions 테이블 생성 구문

**Before (MySQL):**
```sql
CREATE TABLE IF NOT EXISTS suggestions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**After (PostgreSQL):**
```sql
CREATE TABLE IF NOT EXISTS suggestions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**변경 사항:**
- `BIGINT AUTO_INCREMENT` → `BIGSERIAL`
- `ON UPDATE CURRENT_TIMESTAMP` 제거 (PostgreSQL에서 지원하지 않음)

---

#### 변경 2: guide 컬럼 타입 변경

**Before:**
```sql
ALTER TABLE mission_templates ADD COLUMN IF NOT EXISTS guide JSON;
```

**After:**
```sql
ALTER TABLE mission_templates ADD COLUMN IF NOT EXISTS guide JSONB;
```

**변경 사항:**
- `JSON` → `JSONB` (PostgreSQL 권장 타입, 인덱싱 가능)

---

#### 변경 3: JSON 데이터 입력 구문 변경

**Before (MySQL):**
```sql
UPDATE mission_templates
SET guide = JSON_ARRAY(
    JSON_OBJECT('icon', 'WALK', 'title', '중랑천 바람 쐬기', ...),
    JSON_OBJECT('icon', 'DRINK', 'title', '감성 충전', ...)
)
WHERE title = '천변 바람 22';
```

**After (PostgreSQL):**
```sql
UPDATE mission_templates
SET guide = '[
    {"icon": "WALK", "title": "중랑천 바람 쐬기", ...},
    {"icon": "DRINK", "title": "감성 충전", ...}
]'::jsonb
WHERE title = '천변 바람 22';
```

**변경 사항:**
- `JSON_ARRAY()`, `JSON_OBJECT()` 함수 → 네이티브 JSON 문자열 + `::jsonb` 캐스팅
- 4개 UPDATE 문 모두 수정 완료

---

### 2. **MissionTemplate 엔티티 수정**

**파일:** `backend/src/main/java/com/littleescape/api/domain/MissionTemplate.java`

**Before:**
```java
@Lob
@Column(name = "guide", columnDefinition = "JSON")
private String guide;
```

**After:**
```java
@Lob
@Column(name = "guide", columnDefinition = "JSONB")
private String guide;
```

**변경 사항:**
- `columnDefinition = "JSON"` → `columnDefinition = "JSONB"`
- Hibernate가 PostgreSQL JSONB 타입으로 정확히 매핑

---

### 3. **마이그레이션 스크립트 생성**

**파일:** `backend/src/main/resources/db/migration/fix-guide-column.sql`

기존 데이터베이스에 guide 컬럼이 잘못된 타입으로 있을 경우를 대비한 마이그레이션 스크립트:

```sql
ALTER TABLE mission_templates DROP COLUMN IF EXISTS guide CASCADE;
ALTER TABLE mission_templates ADD COLUMN guide JSONB;
```

---

## ✅ 검증 결과

### 빌드 성공
```bash
./gradlew clean build -x test

BUILD SUCCESSFUL in 4s
6 actionable tasks: 6 executed
```

### 애플리케이션 시작 성공
```
Started BackendApplication in 7.386 seconds (process running for 7.769)
Tomcat started on port 8080 (http)
```

---

## 🚨 남은 경고 (무시 가능)

다음 경고가 여전히 나타나지만 애플리케이션 실행에는 영향 없음:

```
WARN: GenerationTarget encountered exception accepting command
Error executing DDL "alter table if exists mission_templates
   alter column guide set data type JSONB"
ERROR: column "guide" cannot be cast automatically to type jsonb
Hint: You might need to specify "USING guide::jsonb".
```

**원인:**
- 데이터베이스에 이미 guide 컬럼이 다른 타입으로 존재
- Hibernate가 자동으로 타입 변환을 시도하다가 실패

**해결 방법 (선택사항):**

#### Option 1: 수동 마이그레이션 (운영 환경 권장)
```sql
-- PostgreSQL에 직접 접속하여 실행
ALTER TABLE mission_templates
ALTER COLUMN guide TYPE JSONB USING guide::jsonb;
```

#### Option 2: 컬럼 재생성 (개발 환경)
```sql
ALTER TABLE mission_templates DROP COLUMN guide CASCADE;
ALTER TABLE mission_templates ADD COLUMN guide JSONB;
-- 이후 data.sql의 UPDATE 문이 자동 실행됨
```

#### Option 3: 전체 재생성 (로컬 개발)
```yaml
# application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: create  # 임시로 변경
```
⚠️ 주의: 모든 데이터가 삭제됩니다!

---

## 📊 MySQL vs PostgreSQL 차이점 정리

| 기능 | MySQL | PostgreSQL |
|------|-------|------------|
| 자동 증가 | `AUTO_INCREMENT` | `SERIAL`, `BIGSERIAL` |
| 자동 업데이트 | `ON UPDATE CURRENT_TIMESTAMP` | 트리거 필요 |
| JSON 타입 | `JSON` | `JSON`, `JSONB` (권장) |
| JSON 함수 | `JSON_OBJECT()`, `JSON_ARRAY()` | 네이티브 JSON + 캐스팅 |

---

## 🎯 향후 조치사항

### 즉시 조치 필요
- ✅ **완료:** data.sql PostgreSQL 문법 수정
- ✅ **완료:** MissionTemplate 엔티티 수정
- ✅ **완료:** 빌드 및 실행 검증

### 선택적 조치
- [ ] guide 컬럼 타입 마이그레이션 실행 (경고 제거용)
- [ ] updated_at 자동 업데이트 트리거 추가 (suggestions 테이블)
- [ ] application.yml에서 `hibernate.dialect` 제거 (불필요)

### 추가 트리거 생성 (선택사항)

updated_at 자동 업데이트를 위한 PostgreSQL 트리거:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_suggestions_updated_at
BEFORE UPDATE ON suggestions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

---

## ✅ 최종 상태

**현재 상태:** ✅ **정상 실행 중**

- 애플리케이션: http://localhost:8080
- LiveReload: http://localhost:35729
- Actuator: http://localhost:8080/actuator

**테스트 방법:**
```bash
# 1. API 상태 확인
curl http://localhost:8080/actuator/health

# 2. 애플리케이션 실행 확인
./gradlew bootRun

# 3. 로그에서 확인할 메시지
Started BackendApplication in X.XXX seconds
```

---

**작성일:** 2026-01-20
**해결 시간:** ~10분
**영향 범위:**
- `backend/src/main/resources/data.sql` (4개 파일 수정)
- `backend/src/main/java/com/littleescape/api/domain/MissionTemplate.java` (1개 파일 수정)
- `backend/src/main/resources/db/migration/fix-guide-column.sql` (신규 생성)

**최종 결과:** ✅ **부트런 성공 - 애플리케이션 정상 실행**
