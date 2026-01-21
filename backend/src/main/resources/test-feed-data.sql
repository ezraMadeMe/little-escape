-- Test data: Set some completed appointments as public for feed testing

-- 1. Update existing completed appointments with photos to be public
UPDATE appointments
SET is_public = true,
    completed_at = COALESCE(completed_at, updated_at)
WHERE status = 'COMPLETED'
  AND (proof_image_url IS NOT NULL OR array_length(proof_image_urls, 1) > 0)
  AND completed_at IS NULL;

-- 2. Verify the changes
SELECT
    id,
    status,
    is_public,
    completed_at,
    proof_comment,
    CASE
        WHEN array_length(proof_image_urls, 1) > 0 THEN array_length(proof_image_urls, 1)
        ELSE 0
    END as image_count
FROM appointments
WHERE is_public = true
ORDER BY completed_at DESC
LIMIT 10;
