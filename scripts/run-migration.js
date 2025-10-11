#!/usr/bin/env node
/**
 * Simple migration runner for Supabase using REST API
 * Usage: node scripts/run-migration.js path/to/migration.sql
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables in .env:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n📖 To get your Service Role Key:');
  console.error('   1. Go to Supabase Dashboard → Settings → API');
  console.error('   2. Copy the "service_role" key (NOT the anon key)');
  console.error('   3. Add it to .env file');
  process.exit(1);
}

async function runMigration(sqlFilePath) {
  try {
    // Read SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log(`📁 Reading migration: ${path.basename(sqlFilePath)}`);
    console.log(`📝 SQL length: ${sql.length} characters\n`);

    // Execute SQL via Supabase REST API
    console.log('⚙️  Executing migration via REST API...');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n💡 You can now verify the changes in your Supabase dashboard');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error('\n💡 If the error is about permissions:');
    console.error('   - Make sure you are using the SERVICE_ROLE key (not anon key)');
    console.error('   - Run the SQL manually in Supabase SQL Editor');
    process.exit(1);
  }
}

// Get SQL file path from command line arguments
const sqlFilePath = process.argv[2];

if (!sqlFilePath) {
  console.log('Usage: node scripts/run-migration.js path/to/migration.sql');
  console.log('\nExample:');
  console.log('  node scripts/run-migration.js migrations/add-education-column.sql');
  process.exit(1);
}

if (!fs.existsSync(sqlFilePath)) {
  console.error(`❌ File not found: ${sqlFilePath}`);
  process.exit(1);
}

runMigration(sqlFilePath);
