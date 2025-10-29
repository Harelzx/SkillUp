-- ============================================
-- Migration 023: Update FKs and Policies from profiles -> students/teachers
-- This migration aligns legacy references to `profiles` with the new split tables
-- (`students`, `teachers`) or `auth.users` where appropriate.
-- ============================================

-- SAFETY: Wrap in a transaction where supported by your migration runner

-- =============== FOREIGN KEYS =================

-- teacher_subjects.teacher_id → teachers(id)
ALTER TABLE IF EXISTS teacher_subjects
  DROP CONSTRAINT IF EXISTS teacher_subjects_teacher_id_fkey;
ALTER TABLE teacher_subjects
  ADD CONSTRAINT teacher_subjects_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;

-- bookings.teacher_id → teachers(id), bookings.student_id → students(id)
ALTER TABLE IF EXISTS bookings
  DROP CONSTRAINT IF EXISTS bookings_teacher_id_fkey,
  DROP CONSTRAINT IF EXISTS bookings_student_id_fkey;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  ADD CONSTRAINT bookings_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- reviews.teacher_id → teachers(id), reviews.student_id → students(id)
ALTER TABLE IF EXISTS reviews
  DROP CONSTRAINT IF EXISTS reviews_teacher_id_fkey,
  DROP CONSTRAINT IF EXISTS reviews_student_id_fkey;
ALTER TABLE reviews
  ADD CONSTRAINT reviews_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  ADD CONSTRAINT reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- teacher_availability.teacher_id → teachers(id)
ALTER TABLE IF EXISTS teacher_availability
  DROP CONSTRAINT IF EXISTS teacher_availability_teacher_id_fkey;
ALTER TABLE teacher_availability
  ADD CONSTRAINT teacher_availability_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;

-- payment_intents.student_id → students(id)
ALTER TABLE IF EXISTS payment_intents
  DROP CONSTRAINT IF EXISTS payment_intents_student_id_fkey;
ALTER TABLE payment_intents
  ADD CONSTRAINT payment_intents_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- payout_accounts.teacher_id → teachers(id)
ALTER TABLE IF EXISTS payout_accounts
  DROP CONSTRAINT IF EXISTS payout_accounts_teacher_id_fkey;
ALTER TABLE payout_accounts
  ADD CONSTRAINT payout_accounts_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;

-- student_credits.student_id updated in migration 022 → auth.users(id)
-- credit_transactions.student_id → students(id)
ALTER TABLE IF EXISTS credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_student_id_fkey;
ALTER TABLE credit_transactions
  ADD CONSTRAINT credit_transactions_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- notifications.user_id → auth.users(id) (generic user)
ALTER TABLE IF EXISTS notifications
  DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- availability_slots.teacher_id (created in earlier migration) → teachers(id)
ALTER TABLE IF EXISTS availability_slots
  DROP CONSTRAINT IF EXISTS availability_slots_teacher_id_fkey;
ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_teacher_id_fkey
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE;

-- payments.student_id (created in earlier migration) → students(id)
ALTER TABLE IF EXISTS payments
  DROP CONSTRAINT IF EXISTS payments_student_id_fkey;
ALTER TABLE payments
  ADD CONSTRAINT payments_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- refunds.student_id (created in earlier migration) → students(id)
ALTER TABLE IF EXISTS refunds
  DROP CONSTRAINT IF EXISTS refunds_student_id_fkey;
ALTER TABLE refunds
  ADD CONSTRAINT refunds_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

-- audit_log.actor_user_id → auth.users(id)
ALTER TABLE IF EXISTS audit_log
  DROP CONSTRAINT IF EXISTS audit_log_actor_user_id_fkey;
ALTER TABLE audit_log
  ADD CONSTRAINT audit_log_actor_user_id_fkey
  FOREIGN KEY (actor_user_id) REFERENCES auth.users(id);

-- =============== POLICIES =================

-- Update bookings INSERT policy that previously checked profiles
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Students can create bookings'
  ) THEN
    DROP POLICY "Students can create bookings" ON bookings;
  END IF;
END $$;

CREATE POLICY "Students can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (SELECT 1 FROM students WHERE id = auth.uid() AND is_active = TRUE)
  );

-- Reviews SELECT/UPDATE policies likely okay; ensure visibility policies refer to new FKs implicitly

-- =============== SUCCESS NOTICE =================
DO $$
BEGIN
  RAISE NOTICE '✅ Updated FKs and policies from profiles to students/teachers/auth.users';
END $$;


