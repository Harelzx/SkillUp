-- Migration 016: Add missing add_student_credits function
-- This function is needed for create_booking to work correctly

-- Function: Add or deduct student credits
CREATE OR REPLACE FUNCTION add_student_credits(
  p_student_id UUID,
  p_amount NUMERIC
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update student credits balance
  INSERT INTO student_credits (student_id, balance)
  VALUES (p_student_id, p_amount)
  ON CONFLICT (student_id)
  DO UPDATE SET
    balance = student_credits.balance + p_amount;

  -- Ensure balance doesn't go negative
  IF (SELECT balance FROM student_credits WHERE student_id = p_student_id) < 0 THEN
    RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = '22000';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_student_credits TO authenticated;

-- Test the function
DO $$
BEGIN
  RAISE NOTICE '✅ Function add_student_credits created successfully';
END $$;
