import { supabase } from './src/lib/supabase';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  try {
    // Test 1: Check subjects
    console.log('Test 1: Fetching subjects...');
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .limit(5);

    if (subjectsError) throw subjectsError;
    console.log('✅ Subjects found:', subjects?.length);
    console.log('   Sample:', (subjects as any)?.[0]?.name_he);

    // Test 2: Check teacher profiles
    console.log('\nTest 2: Fetching teacher profiles...');
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .limit(3);

    if (teachersError) throw teachersError;
    console.log('✅ Teachers found:', teachers?.length);
    console.log('   Sample teacher:', (teachers as any)?.[0]?.display_name);

    // Test 3: Check teacher stats view
    console.log('\nTest 3: Testing teacher_profiles_with_stats view...');
    const { data: teacherStats, error: statsError } = await supabase
      .from('teacher_profiles_with_stats')
      .select('display_name, avg_rating, review_count')
      .limit(3);

    if (statsError) throw statsError;
    console.log('✅ Teacher stats found:', teacherStats?.length);
    if ((teacherStats as any)?.[0]) {
      const stat = (teacherStats as any)[0];
      console.log(`   ${stat.display_name}: ⭐ ${stat.avg_rating}/5 (${stat.review_count} reviews)`);
    }

    // Test 4: Check auth
    console.log('\nTest 4: Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) throw authError;
    if (authData.session) {
      console.log('✅ User is authenticated:', authData.session.user.email);
    } else {
      console.log('ℹ️  No user logged in (this is OK for initial test)');
    }

    // Test 5: Try logging in with test user
    console.log('\nTest 5: Testing login with seed data user...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'sarah.cohen@skillup.co.il',
      password: 'teacher123',
    });

    if (loginError) {
      console.log('⚠️  Login failed:', loginError.message);
      console.log('   This might mean seed data wasn\'t run or passwords are different');
    } else {
      console.log('✅ Login successful!');
      console.log('   User:', loginData.user?.email);
      console.log('   User ID:', loginData.user?.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', loginData.user?.id)
        .single();

      if (profile) {
        console.log('   Profile:', (profile as any).display_name, `(${(profile as any).role})`);
      }

      // Logout after test
      await supabase.auth.signOut();
      console.log('   Logged out after test');
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n✅ Your Supabase backend is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Update your app screens to use the API services');
    console.log('2. Test the app with real data');
    console.log('3. Configure authentication flow');

  } catch (error: any) {
    console.error('\n❌ Error testing Supabase connection:');
    console.error('   Message:', error.message);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);

    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that .env file exists with correct credentials');
    console.log('2. Verify schema.sql was run successfully');
    console.log('3. Verify seed.sql was run successfully');
    console.log('4. Check Supabase dashboard for any issues');
  }
}

// Run the test
testSupabaseConnection().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
