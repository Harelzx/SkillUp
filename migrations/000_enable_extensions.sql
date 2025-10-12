-- ============================================
-- Migration 000: Enable Required Extensions
-- Must run FIRST before all other migrations
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable text search (for future search features)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verify extensions are enabled
DO $$
BEGIN
  -- Test uuid_generate_v4()
  PERFORM uuid_generate_v4();
  RAISE NOTICE 'UUID extension working!';
  
  RAISE NOTICE 'Migration 000 completed successfully!';
  RAISE NOTICE 'Extensions enabled: uuid-ossp, pg_trgm';
END $$;

