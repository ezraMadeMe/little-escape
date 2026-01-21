-- ========================================
-- EXECUTE THIS IN SUPABASE SQL EDITOR
-- ========================================
-- This script safely adds is_public and completed_at columns to appointments table
-- and prepares sample data for the feed feature

-- Step 1: Add is_public column as nullable first
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS is_public BOOLEAN;

-- Step 2: Set default values for existing rows
UPDATE appointments
SET is_public = false
WHERE is_public IS NULL;

-- Step 3: Add NOT NULL constraint and default
ALTER TABLE appointments
ALTER COLUMN is_public SET NOT NULL,
ALTER COLUMN is_public SET DEFAULT false;

-- Step 4: Add completed_at column (nullable, no default needed)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Step 5: Backfill completed_at for existing completed appointments
UPDATE appointments
SET completed_at = updated_at
WHERE status = 'COMPLETED' AND completed_at IS NULL;

-- Step 6: Create performance index for feed queries
CREATE INDEX IF NOT EXISTS idx_appointments_feed
ON appointments (status, is_public, completed_at DESC)
WHERE status = 'COMPLETED' AND is_public = true;

-- Step 7: Set up test data - make 10 completed appointments with photos public
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

-- Step 8: Verify the changes
SELECT
    COUNT(*) as total_public_feed_items,
    COUNT(CASE WHEN array_length(proof_image_urls, 1) > 0 THEN 1 END) as with_images
FROM appointments
WHERE is_public = true
  AND status = 'COMPLETED';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Schema update completed successfully!';
    RAISE NOTICE '📊 Public feed items: %', (
        SELECT COUNT(*)
        FROM appointments
        WHERE is_public = true AND status = 'COMPLETED'
    );
END $$;
