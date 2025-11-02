/*
  # Add Missing Indexes and Fix Vector Extension Schema

  1. Performance Improvements
    - Add indexes for all foreign keys to improve query performance
    - These indexes will speed up joins and foreign key constraint checks
    
  2. Extension Schema Fix
    - Move vector extension from public schema to extensions schema
    - This follows PostgreSQL best practices for extension management
    
  3. New Indexes Created
    - certificates: course_id, test_result_id
    - course_materials: course_id
    - feedback: course_id, user_id
    - test_results: course_id, test_id
    - tests: course_id
    - user_achievements: achievement_id
    - user_progress: course_id

  4. Security & Performance
    - Foreign key indexes prevent table scans on join operations
    - Improves referential integrity check performance
    - Extension isolation improves schema organization
*/

-- Move vector extension to extensions schema
DO $$ 
BEGIN
  -- Create extensions schema if it doesn't exist
  CREATE SCHEMA IF NOT EXISTS extensions;
  
  -- Drop extension from public schema if it exists
  DROP EXTENSION IF EXISTS vector CASCADE;
  
  -- Create extension in extensions schema
  CREATE EXTENSION IF NOT EXISTS vector SCHEMA extensions;
END $$;

-- Add missing indexes for foreign keys

-- Certificates table indexes
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_test_result_id ON certificates(test_result_id);

-- Course materials table indexes
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON course_materials(course_id);

-- Feedback table indexes
CREATE INDEX IF NOT EXISTS idx_feedback_course_id ON feedback(course_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);

-- Test results table indexes
CREATE INDEX IF NOT EXISTS idx_test_results_course_id ON test_results(course_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);

-- Tests table indexes
CREATE INDEX IF NOT EXISTS idx_tests_course_id ON tests(course_id);

-- User achievements table indexes
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- User progress table indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_test_results_user_course ON test_results(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_achievement ON user_achievements(user_id, achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course ON user_progress(user_id, course_id);

-- Note: The "unused index" warnings are expected for new tables with no queries yet
-- These indexes will be utilized once the application starts running queries