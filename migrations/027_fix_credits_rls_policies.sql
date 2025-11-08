-- Migration 027: Fix Credits RLS Policies
-- Problem: Overly restrictive RLS policies with WITH CHECK (false) and USING (false)
--          were blocking even SECURITY DEFINER functions from modifying credit tables
-- Solution: Drop the blocking policies to allow SECURITY DEFINER functions to operate
--          while maintaining security (students still cannot directly modify these tables)

-- Drop the overly restrictive RLS policies
DROP POLICY IF EXISTS "Credit transactions are created by system only" ON credit_transactions;
DROP POLICY IF EXISTS "Student credits updated by system only" ON student_credits;
DROP POLICY IF EXISTS "Students can create own credits record" ON student_credits;

-- Note: By not having INSERT/UPDATE policies on these tables:
-- 1. SECURITY DEFINER functions (like redeem_coupon, add_student_credits) can operate
-- 2. Regular users still cannot directly INSERT/UPDATE (no policy = no access)
-- 3. Students can still SELECT their own records via existing SELECT policies
-- 4. This maintains security while allowing legitimate system operations

-- Verify RLS is still enabled on the tables
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_credits ENABLE ROW LEVEL SECURITY;

-- Keep the existing SELECT policies for students to view their own data
-- (These were not the problem - they should remain)
