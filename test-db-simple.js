// Simple Node.js test for Supabase connection (without React Native dependencies)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ntofcpjwulypvjcsytqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50b2ZjcGp3dWx5cHZqY3N5dHF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzAxNDMsImV4cCI6MjA3NTcwNjE0M30.VWZ9OIMBFgipEG6CfGKlZI5dxar-RSQtRgvVx56xh80';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');

  try {
    // Test 1: Fetch subjects
    console.log('📚 Test 1: Fetching subjects...');
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .limit(5);

    if (subjectsError) throw subjectsError;
    console.log(`✅ Found ${subjects.length} subjects`);
    subjects.forEach(s => console.log(`   - ${s.name_he} (${s.name})`));

    // Test 2: Fetch teacher profiles
    console.log('\n👨‍🏫 Test 2: Fetching teacher profiles...');
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .limit(5);

    if (teachersError) throw teachersError;
    console.log(`✅ Found ${teachers.length} teachers`);
    teachers.forEach(t => {
      console.log(`   - ${t.display_name} (${t.location}) - ₪${t.hourly_rate}/hr`);
    });

    // Test 3: Fetch bookings
    console.log('\n📅 Test 3: Fetching bookings...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(3);

    if (bookingsError) throw bookingsError;
    console.log(`✅ Found ${bookings.length} bookings`);
    bookings.forEach(b => {
      console.log(`   - Booking ${b.id.slice(0, 8)}... (${b.status})`);
    });

    // Test 4: Fetch reviews
    console.log('\n⭐ Test 4: Fetching reviews...');
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .limit(3);

    if (reviewsError) throw reviewsError;
    console.log(`✅ Found ${reviews.length} reviews`);
    reviews.forEach(r => {
      console.log(`   - Rating: ${'⭐'.repeat(r.rating)} (${r.rating}/5)`);
    });

    // Test 5: Test teacher stats view
    console.log('\n📊 Test 5: Testing teacher_profiles_with_stats view...');
    const { data: teacherStats, error: statsError } = await supabase
      .from('teacher_profiles_with_stats')
      .select('display_name, avg_rating, review_count, hourly_rate')
      .limit(5);

    if (statsError) throw statsError;
    console.log(`✅ Found ${teacherStats.length} teachers with stats`);
    teacherStats.forEach(t => {
      console.log(`   - ${t.display_name}: ⭐ ${t.avg_rating}/5 (${t.review_count} reviews) - ₪${t.hourly_rate}/hr`);
    });

    // Test 6: Count records
    console.log('\n🔢 Test 6: Counting all records...');

    const { count: subjectCount } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true });

    const { count: teacherCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    const { count: studentCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    console.log('✅ Database statistics:');
    console.log(`   - Subjects: ${subjectCount}`);
    console.log(`   - Teachers: ${teacherCount}`);
    console.log(`   - Students: ${studentCount}`);

    console.log('\n🎉 All database tests passed!');
    console.log('\n✅ Your Supabase backend is connected and working!');
    console.log('\n📱 Next steps:');
    console.log('   1. Test authentication in the mobile app');
    console.log('   2. Update screens to use real API data');
    console.log('   3. Test booking and payment flows');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) console.error('   Details:', error.details);
    if (error.hint) console.error('   Hint:', error.hint);

    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Supabase project is active');
    console.log('   2. Verify schema.sql was run');
    console.log('   3. Verify seed.sql was run');
    console.log('   4. Check API keys are correct');
    process.exit(1);
  }
}

testConnection();
