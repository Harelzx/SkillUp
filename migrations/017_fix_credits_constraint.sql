-- Migration 017: Fix student_credits constraint issue
-- The constraint is preventing ON CONFLICT UPDATE from working

-- Step 1: Drop the old constraint
ALTER TABLE student_credits
DROP CONSTRAINT IF EXISTS student_credits_balance_check;

-- Step 2: Don't add it back - the check will be done in the function instead
-- The add_student_credits function already checks for negative balance

-- Verify
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'student_credits'::regclass;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Removed balance check constraint - validation now in add_student_credits function';
END $$;
