/**
 * Simple Migration Runner for Supabase
 * Runs SQL files directly without exec_sql function
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('💡 Add these to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filePath) {
  try {
    console.log(`📁 Reading migration: ${path.basename(filePath)}`);
    
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`📝 SQL length: ${sql.length} characters\n`);

    console.log('⚙️  Executing migration...');
    
    // Execute SQL directly using raw query
    const { data, error } = await supabase.rpc('query', {
      query_text: sql
    });

    if (error) {
      // Try alternative method - some Supabase instances don't have 'query' RPC
      console.log('⚠️  Standard RPC failed, trying alternative...\n');
      console.log('📋 Please copy and paste the SQL into Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/_/sql');
      console.log('');
      console.log('─'.repeat(80));
      console.log(sql);
      console.log('─'.repeat(80));
      console.log('');
      throw new Error(`Please run the SQL manually. Original error: ${error.message}`);
    }

    console.log('✅ Migration completed successfully!\n');
    return data;

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('💡 Solution: Run the SQL manually in Supabase SQL Editor');
    console.error('   1. Go to: https://supabase.com/dashboard/project/_/sql');
    console.error('   2. Copy the contents of:', filePath);
    console.error('   3. Paste into SQL Editor and click RUN');
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node scripts/run-migrations-simple.js <migration-file>');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/run-migrations-simple.js migrations/013_add_teacher_settings_fields.sql');
    console.log('  node scripts/run-migrations-simple.js migrations/014_availability_management_functions.sql');
    process.exit(1);
  }

  const migrationFile = args[0];
  
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  console.log('🚀 Teacher Interface Upgrade - Migration Runner\n');
  
  await runMigration(migrationFile);
  
  console.log('🎉 All done!');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Refresh your app');
  console.log('  2. Test teacher profile editing');
  console.log('  3. Test availability management');
}

main().catch((error) => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});

