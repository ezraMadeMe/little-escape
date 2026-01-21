-- Fix: Add is_public and completed_at columns to appointments table
-- 2단계 접근: 먼저 nullable로 추가 후 기본값 설정 → NOT NULL 제약조건 추가

-- Step 1: is_public 컬럼을 nullable로 먼저 추가
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_public BOOLEAN;

-- Step 2: 기존 데이터에 기본값 설정
UPDATE appointments
SET is_public = false
WHERE is_public IS NULL;

-- Step 3: NOT NULL 제약조건 추가 + 기본값 설정
ALTER TABLE appointments
ALTER COLUMN is_public SET NOT NULL,
ALTER COLUMN is_public SET DEFAULT false;

-- Step 4: completed_at 컬럼 추가 (nullable, 기본값 없음)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Step 5: 기존 완료된 약속에 completed_at 설정 (updated_at 기반)
UPDATE appointments
SET completed_at = updated_at
WHERE status = 'COMPLETED' AND completed_at IS NULL;

-- Step 6: 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_appointments_feed
ON appointments (status, is_public, completed_at DESC)
WHERE status = 'COMPLETED' AND is_public = true;

-- Step 7: 테스트용 데이터 - 인증샷이 있는 완료된 약속 10개를 공개로 설정
UPDATE appointments
SET is_public = true
WHERE id IN (
    SELECT id
    FROM appointments
    WHERE status = 'COMPLETED'
      AND (
        proof_image_url IS NOT NULL
        OR array_length(proof_image_urls, 1) > 0
      )
      AND is_public = false
    ORDER BY completed_at DESC NULLS LAST
    LIMIT 10
);

-- Step 8: 검증 - 공개된 피드 데이터 확인
SELECT
    id,
    status,
    is_public,
    completed_at,
    proof_comment,
    CASE
        WHEN array_length(proof_image_urls, 1) IS NOT NULL
        THEN array_length(proof_image_urls, 1)
        ELSE 0
    END as image_count,
    user_id
FROM appointments
WHERE is_public = true
  AND status = 'COMPLETED'
ORDER BY completed_at DESC
LIMIT 10;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 피드 컬럼 추가 완료!';
    RAISE NOTICE '📊 공개된 피드 데이터: % 건', (
        SELECT COUNT(*)
        FROM appointments
        WHERE is_public = true AND status = 'COMPLETED'
    );
END $$;
