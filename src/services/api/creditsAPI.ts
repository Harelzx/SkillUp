import { supabase } from '@/lib/supabase';
import type { CreditTransaction } from '@/types/api';

// ============================================
// GET CREDITS & TRANSACTIONS
// ============================================

/**
 * Get student's current credit balance
 */
export async function getCreditBalance() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error('Authentication error: ' + authError.message);
  }

  if (!user) {
    throw new Error('Not authenticated');
  }

  // First, check profile role to verify user is a student
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'student') {
    console.log('🔵 [creditsAPI] User is not a student, returning 0');
    return 0;
  }

  // Get credit balance
  const { data, error } = await supabase
    .from('student_credits')
    .select('balance')
    .eq('student_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('❌ [creditsAPI] Error fetching credits:', error);
    throw error;
  }

  // If no record exists, create one with 0 balance
  if (!data) {
    const { data: newRecord, error: insertError } = await supabase
      .from('student_credits')
      .insert({ student_id: user.id, balance: 0 })
      .select('balance')
      .maybeSingle();

    if (insertError) {
      console.error('❌ [creditsAPI] Error creating credit record:', insertError);
      throw insertError;
    }
    return newRecord?.balance ?? 0;
  }

  return data.balance ?? 0;
}

/**
 * Get student's credit transaction history
 */
export async function getCreditTransactions(params?: {
  limit?: number;
  offset?: number;
  type?: 'purchase' | 'used' | 'refund' | 'bonus';
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('credit_transactions')
    .select(`
      *,
      booking:bookings(
        id,
        start_at,
        teacher:profiles!bookings_teacher_id_fkey(display_name),
        subject:subjects(name_he)
      )
    `, { count: 'exact' })
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

  if (params?.type) {
    query = query.eq('type', params.type);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }

  if (params?.offset) {
    query = query.range(
      params.offset,
      params.offset + (params.limit || 10) - 1
    );
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    transactions: data as CreditTransaction[],
    total: count || 0,
  };
}

/**
 * Get credit transaction by ID
 */
export async function getCreditTransaction(transactionId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('credit_transactions')
    .select(`
      *,
      booking:bookings(
        id,
        start_at,
        teacher:profiles!bookings_teacher_id_fkey(display_name),
        subject:subjects(name_he)
      )
    `)
    .eq('id', transactionId)
    .eq('student_id', user.id)
    .single();

  if (error) throw error;
  return data as CreditTransaction;
}

// ============================================
// PURCHASE CREDITS
// ============================================

/**
 * Purchase credits (creates pending transaction, completed after payment)
 */
export async function purchaseCredits(amount: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // Create transaction record
  const { data: transaction, error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      student_id: user.id,
      amount,
      type: 'purchase',
      description: `רכישת ${amount} ₪ קרדיטים`,
    })
    .select()
    .single();

  if (transactionError) throw transactionError;

  return transaction as CreditTransaction;
}

/**
 * Complete credit purchase after successful payment
 * (Called from payment webhook/callback)
 */
export async function completeCreditPurchase(
  transactionId: string,
  paymentIntentId: string
) {
  const { data: transaction, error: getError } = await supabase
    .from('credit_transactions')
    .select('student_id, amount')
    .eq('id', transactionId)
    .single();

  if (getError) throw getError;

  // Update student's balance
  const { error: updateError } = await supabase
    .rpc('add_student_credits', {
      p_student_id: transaction.student_id,
      p_amount: transaction.amount,
  });

  if (updateError) throw updateError;

  // Update transaction with payment reference
  const { data, error } = await supabase
    .from('credit_transactions')
    .update({
      payment_intent_id: paymentIntentId,
      description: `רכישת ${transaction.amount} ₪ קרדיטים - בוצע בהצלחה`,
    })
    .eq('id', transactionId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// USE CREDITS (for booking)
// ============================================

/**
 * Deduct credits for a booking
 * (Automatically called when booking is created/confirmed)
 */
export async function useCreditsForBooking(
  bookingId: string,
  amount: number,
  teacherName: string,
  subjectName: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if student has enough credits
  const balance = await getCreditBalance();
  if (balance < amount) {
    throw new Error('Insufficient credits');
  }

  // Create transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      student_id: user.id,
      amount: -amount,
      type: 'used',
      booking_id: bookingId,
      description: `תשלום עבור שיעור ${subjectName} עם ${teacherName}`,
    })
    .select()
    .single();

  if (transactionError) throw transactionError;

  // Deduct from balance
  const { error: updateError } = await supabase
    .rpc('add_student_credits', {
      p_student_id: user.id,
      p_amount: -amount,
    });

  if (updateError) throw updateError;

  return transaction as CreditTransaction;
}

// ============================================
// REFUND CREDITS
// ============================================

/**
 * Refund credits (when booking is cancelled)
 */
export async function refundCredits(
  bookingId: string,
  amount: number,
  reason: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create refund transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      student_id: user.id,
      amount,
      type: 'refund',
      booking_id: bookingId,
      description: `החזר: ${reason}`,
    })
    .select()
    .single();

  if (transactionError) throw transactionError;

  // Add to balance
  const { error: updateError } = await supabase
    .rpc('add_student_credits', {
      p_student_id: user.id,
      p_amount: amount,
    });

  if (updateError) throw updateError;

  return transaction as CreditTransaction;
}

// ============================================
// BONUS CREDITS
// ============================================

/**
 * Award bonus credits (admin/system function)
 */
export async function awardBonusCredits(
  studentId: string,
  amount: number,
  description: string
) {
  // Create bonus transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('credit_transactions')
    .insert({
      student_id: studentId,
      amount,
      type: 'bonus',
      description,
    })
    .select()
    .single();

  if (transactionError) throw transactionError;

  // Add to balance
  const { error: updateError } = await supabase
    .rpc('add_student_credits', {
      p_student_id: studentId,
      p_amount: amount,
    });

  if (updateError) throw updateError;

  return transaction as CreditTransaction;
}

// ============================================
// COUPON REDEMPTION
// ============================================

/**
 * Redeem a coupon code for credits
 */
export async function redeemCoupon(code: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('redeem_coupon', {
      p_student_id: user.id,
      p_code: code.toUpperCase().trim(),
    });

  if (error) throw error;
  return data as {
    success: boolean;
    credits_awarded: number;
    description: string;
    transaction_id: string;
  };
}

/**
 * Get student's coupon redemption history
 */
export async function getCouponRedemptions() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('coupon_redemptions')
    .select(`
      *,
      coupon:coupons(code, description)
    `)
    .eq('student_id', user.id)
    .order('redeemed_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================
// CREDIT STATISTICS
// ============================================

/**
 * Get student's credit statistics
 */
export async function getCreditStatistics() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const balance = await getCreditBalance();

  // Get total purchased
  const { data: purchases } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('student_id', user.id)
    .eq('type', 'purchase');

  const totalPurchased = purchases?.reduce((sum, t) => sum + t.amount, 0) || 0;

  // Get total used
  const { data: used } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('student_id', user.id)
    .eq('type', 'used');

  const totalUsed = Math.abs(used?.reduce((sum, t) => sum + t.amount, 0) || 0);

  // Get total bonuses
  const { data: bonuses } = await supabase
    .from('credit_transactions')
    .select('amount')
    .eq('student_id', user.id)
    .eq('type', 'bonus');

  const totalBonuses = bonuses?.reduce((sum, t) => sum + t.amount, 0) || 0;

  return {
    currentBalance: balance,
    totalPurchased,
    totalUsed,
    totalBonuses,
  };
}
