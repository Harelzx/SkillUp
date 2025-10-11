import { supabase } from '@/src/lib/supabase';
import type { PaymentIntent, PayoutAccount } from '@/src/types/api';

// ============================================
// PAYMENT INTENTS (Student Payments)
// ============================================

/**
 * Create payment intent for credit purchase
 */
export async function createPaymentIntent(amount: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // In production, this would call Stripe API to create payment intent
  // For now, we'll create a database record
  const { data, error } = await supabase
    .from('payment_intents')
    .insert({
      student_id: user.id,
      amount,
      currency: 'ILS',
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // TODO: Call Stripe API to create actual payment intent
  // const stripeIntent = await stripe.paymentIntents.create({
  //   amount: Math.round(amount * 100), // Stripe uses cents
  //   currency: 'ils',
  //   metadata: {
  //     student_id: user.id,
  //     payment_intent_id: data.id,
  //   },
  // });

  // Update with Stripe payment intent ID
  // await supabase
  //   .from('payment_intents')
  //   .update({ stripe_payment_intent_id: stripeIntent.id })
  //   .eq('id', data.id);

  return data as PaymentIntent;
}

/**
 * Get payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('payment_intents')
    .select('*')
    .eq('id', paymentIntentId)
    .eq('student_id', user.id)
    .single();

  if (error) throw error;
  return data as PaymentIntent;
}

/**
 * Update payment intent status
 * (Called from Stripe webhook)
 */
export async function updatePaymentIntentStatus(
  paymentIntentId: string,
  status: 'succeeded' | 'failed' | 'cancelled',
  stripePaymentIntentId?: string
) {
  const { data, error } = await supabase
    .from('payment_intents')
    .update({
      status,
      stripe_payment_intent_id: stripePaymentIntentId,
    })
    .eq('id', paymentIntentId)
    .select()
    .single();

  if (error) throw error;
  return data as PaymentIntent;
}

/**
 * Get student's payment history
 */
export async function getPaymentHistory(params?: {
  limit?: number;
  offset?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('payment_intents')
    .select('*', { count: 'exact' })
    .eq('student_id', user.id)
    .order('created_at', { ascending: false });

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
    payments: data as PaymentIntent[],
    total: count || 0,
  };
}

// ============================================
// STRIPE CONNECT (Teacher Payouts)
// ============================================

/**
 * Create Stripe Connect account for teacher
 */
export async function createPayoutAccount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if teacher profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) throw profileError;

  if (profile.role !== 'teacher') {
    throw new Error('Only teachers can create payout accounts');
  }

  // Check if account already exists
  const { data: existing } = await supabase
    .from('payout_accounts')
    .select('id')
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (existing) {
    throw new Error('Payout account already exists');
  }

  // TODO: Create Stripe Connect account
  // const account = await stripe.accounts.create({
  //   type: 'express',
  //   country: 'IL',
  //   capabilities: {
  //     card_payments: { requested: true },
  //     transfers: { requested: true },
  //   },
  // });

  const { data, error } = await supabase
    .from('payout_accounts')
    .insert({
      teacher_id: user.id,
      // stripe_account_id: account.id,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as PayoutAccount;
}

/**
 * Get teacher's payout account
 */
export async function getPayoutAccount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('payout_accounts')
    .select('*')
    .eq('teacher_id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data as PayoutAccount | null;
}

/**
 * Update payout account status
 * (Called from Stripe webhook when account is verified)
 */
export async function updatePayoutAccountStatus(
  accountId: string,
  status: 'active' | 'pending' | 'restricted',
  details?: any
) {
  const { data, error } = await supabase
    .from('payout_accounts')
    .update({
      status,
      details_submitted: status === 'active',
      payouts_enabled: status === 'active',
    })
    .eq('id', accountId)
    .select()
    .single();

  if (error) throw error;
  return data as PayoutAccount;
}

/**
 * Get Stripe Connect onboarding link for teacher
 */
export async function getConnectOnboardingLink() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const account = await getPayoutAccount();
  if (!account) {
    throw new Error('No payout account found');
  }

  // TODO: Create Stripe account link
  // const accountLink = await stripe.accountLinks.create({
  //   account: account.stripe_account_id,
  //   refresh_url: 'skillup://teacher/settings/payout',
  //   return_url: 'skillup://teacher/settings/payout/success',
  //   type: 'account_onboarding',
  // });

  // return accountLink.url;

  return 'https://connect.stripe.com/setup/placeholder'; // Placeholder
}

/**
 * Get teacher's earnings statistics
 */
export async function getEarningsStatistics() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get completed bookings
  const { data: completedBookings, error } = await supabase
    .from('bookings')
    .select('price')
    .eq('teacher_id', user.id)
    .eq('status', 'completed');

  if (error) throw error;

  const totalEarnings = completedBookings?.reduce((sum, b) => sum + b.price, 0) || 0;

  // Get current month earnings
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthBookings } = await supabase
    .from('bookings')
    .select('price')
    .eq('teacher_id', user.id)
    .eq('status', 'completed')
    .gte('end_at', startOfMonth.toISOString());

  const monthEarnings = monthBookings?.reduce((sum, b) => sum + b.price, 0) || 0;

  // Get pending earnings (confirmed but not completed)
  const { data: pendingBookings } = await supabase
    .from('bookings')
    .select('price')
    .eq('teacher_id', user.id)
    .eq('status', 'confirmed');

  const pendingEarnings = pendingBookings?.reduce((sum, b) => sum + b.price, 0) || 0;

  return {
    totalEarnings,
    monthEarnings,
    pendingEarnings,
    completedLessons: completedBookings?.length || 0,
  };
}

// ============================================
// PRICING & PACKAGES
// ============================================

/**
 * Get available credit packages
 */
export function getCreditPackages() {
  return [
    {
      id: 'package_100',
      amount: 100,
      bonus: 0,
      total: 100,
      price: 100,
      displayPrice: '₪100',
      popular: false,
    },
    {
      id: 'package_300',
      amount: 300,
      bonus: 20,
      total: 320,
      price: 300,
      displayPrice: '₪300',
      popular: false,
    },
    {
      id: 'package_500',
      amount: 500,
      bonus: 50,
      total: 550,
      price: 500,
      displayPrice: '₪500',
      popular: true,
      savings: '10% חיסכון',
    },
    {
      id: 'package_1000',
      amount: 1000,
      bonus: 150,
      total: 1150,
      price: 1000,
      displayPrice: '₪1,000',
      popular: false,
      savings: '15% חיסכון',
    },
    {
      id: 'package_2000',
      amount: 2000,
      bonus: 400,
      total: 2400,
      price: 2000,
      displayPrice: '₪2,000',
      popular: false,
      savings: '20% חיסכון',
    },
  ];
}

/**
 * Calculate booking price based on duration
 */
export function calculateBookingPrice(
  hourlyRate: number,
  durationMinutes: number
): number {
  const hours = durationMinutes / 60;
  return Math.round(hourlyRate * hours * 100) / 100; // Round to 2 decimal places
}
