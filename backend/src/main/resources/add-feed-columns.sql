-- Add is_public and completed_at columns to appointments table for feed functionality

-- Add is_public column (default false)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Add completed_at column
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Create index for feed query performance
CREATE INDEX IF NOT EXISTS idx_appointments_feed
ON appointments (status, is_public, completed_at DESC);

-- Optional: Update existing completed appointments to have completedAt
-- (Only if you want to backfill existing data)
-- UPDATE appointments
-- SET completed_at = updated_at
-- WHERE status = 'COMPLETED' AND completed_at IS NULL;

-- Optional: Set some completed appointments as public for testing
-- UPDATE appointments
-- SET is_public = true
-- WHERE status = 'COMPLETED'
-- AND proof_comment IS NOT NULL
-- LIMIT 10;

COMMENT ON COLUMN appointments.is_public IS '피드 공개 여부 (true: 공개, false: 비공개)';
COMMENT ON COLUMN appointments.completed_at IS '약속 완료 시간';
