-- ============================================
-- Migration 007: Complete RLS Policies (SAFE)
-- Can be run multiple times safely
-- ============================================

ALTER TABLE idempotency_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Idempotency requests are internal only" ON idempotency_requests;
CREATE POLICY "Idempotency requests are internal only" ON idempotency_requests FOR ALL USING (false);

DROP POLICY IF EXISTS "Students can view available slots" ON availability_slots;
CREATE POLICY "Students can view available slots" ON availability_slots FOR SELECT
  USING (is_booked = FALSE OR auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT
  USING (auth.uid() = teacher_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create bookings" ON bookings;
CREATE POLICY "Students can create bookings" ON bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student' AND is_active = TRUE));

DROP POLICY IF EXISTS "Booking parties can update" ON bookings;
DROP POLICY IF EXISTS "Booking parties can update status" ON bookings;
CREATE POLICY "Booking parties can update status" ON bookings FOR UPDATE
  USING (auth.uid() = teacher_id OR auth.uid() = student_id)
  WITH CHECK (auth.uid() = teacher_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can view own refunds" ON refunds;
CREATE POLICY "Students can view own refunds" ON refunds FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Refunds are created by system only" ON refunds;
CREATE POLICY "Refunds are created by system only" ON refunds FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Students can view own transactions" ON credit_transactions;
CREATE POLICY "Students can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Credit transactions are created by system only" ON credit_transactions;
CREATE POLICY "Credit transactions are created by system only" ON credit_transactions FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Students can view own credits" ON student_credits;
CREATE POLICY "Students can view own credits" ON student_credits FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can create own credits record" ON student_credits;
CREATE POLICY "Students can create own credits record" ON student_credits FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Student credits updated by system only" ON student_credits;
CREATE POLICY "Student credits updated by system only" ON student_credits FOR UPDATE USING (false);

DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
CREATE POLICY "Users can view own audit logs" ON audit_log FOR SELECT USING (auth.uid() = actor_user_id);

DROP POLICY IF EXISTS "Audit logs are created by system only" ON audit_log;
CREATE POLICY "Audit logs are created by system only" ON audit_log FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark own notifications as read" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark own notifications as read" ON notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Notifications are created by system only" ON notifications;
CREATE POLICY "Notifications are created by system only" ON notifications FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Teachers can view payments for their bookings" ON payments;
CREATE POLICY "Teachers can view payments for their bookings" ON payments FOR SELECT USING (
  auth.uid() = student_id OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = payments.booking_id AND bookings.teacher_id = auth.uid())
);

DROP POLICY IF EXISTS "Payments are managed by system only" ON payments;
CREATE POLICY "Payments are managed by system only" ON payments FOR INSERT WITH CHECK (false);

DROP POLICY IF EXISTS "Payments cannot be updated directly" ON payments;
CREATE POLICY "Payments cannot be updated directly" ON payments FOR UPDATE USING (false);

CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_booking(p_booking_id UUID) RETURNS BOOLEAN AS $$
DECLARE v_can_access BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM bookings WHERE id = p_booking_id AND (teacher_id = auth.uid() OR student_id = auth.uid())) INTO v_can_access;
  RETURN v_can_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_booking TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_booking TO authenticated;
GRANT EXECUTE ON FUNCTION check_booking_overlap TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_booking TO authenticated;

GRANT SELECT ON teacher_profiles_with_stats TO authenticated, anon;

CREATE OR REPLACE FUNCTION prevent_booking_overlap() RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings WHERE teacher_id = NEW.teacher_id AND id != NEW.id
      AND status IN ('pending', 'confirmed', 'awaiting_payment')
      AND (start_at, end_at) OVERLAPS (NEW.start_at, NEW.end_at)
  ) THEN
    RAISE EXCEPTION 'Booking overlaps with existing booking' USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_booking_overlap_trigger ON bookings;
CREATE TRIGGER prevent_booking_overlap_trigger BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION prevent_booking_overlap();

CREATE INDEX IF NOT EXISTS idx_bookings_student_auth ON bookings(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_teacher_auth ON bookings(teacher_id) WHERE teacher_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_auth ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_student_auth ON payments(student_id) WHERE student_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'Migration 007 (SAFE) completed!';
END $$;

