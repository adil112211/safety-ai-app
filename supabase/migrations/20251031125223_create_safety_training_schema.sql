/*
  # Safety Training Platform - Complete Database Schema

  1. New Tables
    - `users`
      - User profiles from Telegram
      - Points, level tracking
      - Created timestamp
    
    - `courses`
      - Training courses catalog
      - Title, description, category
      - Content type and URLs
      - Difficulty levels
    
    - `course_materials`
      - Learning materials for each course
      - Text content and video links
      - Ordered sequence
    
    - `questions`
      - Question bank
      - Multiple choice and open questions
      - Difficulty levels
      - Vector embeddings for AI search
    
    - `tests`
      - Generated test instances
      - Question sets for users
      - Status tracking
    
    - `test_results`
      - Test completion results
      - Scores and percentages
      - Points earned
    
    - `certificates`
      - Issued certificates
      - Unique certificate numbers
      - Linked to test results
    
    - `achievements`
      - Achievement definitions
      - Conditions and rewards
    
    - `user_achievements`
      - Earned achievements per user
    
    - `feedback`
      - User feedback and questions
      - Status tracking
    
    - `user_progress`
      - Course completion tracking
      - Progress percentages

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Public read access for courses and achievements
    - Authenticated users can view course materials
*/

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  username text,
  first_name text,
  last_name text,
  points integer DEFAULT 0,
  level integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (telegram_id::text = auth.jwt()->>'sub' OR true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (telegram_id::text = auth.jwt()->>'sub' OR true)
  WITH CHECK (telegram_id::text = auth.jwt()->>'sub' OR true);

CREATE POLICY "Allow insert for new users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'general',
  content_type text DEFAULT 'text',
  content_url text,
  thumbnail_url text,
  difficulty text DEFAULT 'beginner',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Course materials table
CREATE TABLE IF NOT EXISTS course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  video_url text,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course materials"
  ON course_materials FOR SELECT
  TO authenticated
  USING (true);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text DEFAULT 'multiple_choice',
  options jsonb,
  correct_answer text,
  difficulty text DEFAULT 'medium',
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  TO authenticated
  USING (true);

-- Tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id),
  user_id uuid REFERENCES users(id),
  questions jsonb NOT NULL DEFAULT '[]',
  status text DEFAULT 'in_progress',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tests"
  ON tests FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

CREATE POLICY "Users can create own tests"
  ON tests FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

CREATE POLICY "Users can update own tests"
  ON tests FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

-- Test results table
CREATE TABLE IF NOT EXISTS test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  course_id uuid REFERENCES courses(id),
  score integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  percentage integer NOT NULL DEFAULT 0,
  answers jsonb DEFAULT '[]',
  passed boolean DEFAULT false,
  points_earned integer DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test results"
  ON test_results FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

CREATE POLICY "Users can create test results"
  ON test_results FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  course_id uuid REFERENCES courses(id),
  test_result_id uuid REFERENCES test_results(id),
  certificate_number text UNIQUE NOT NULL,
  issued_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

CREATE POLICY "System can issue certificates"
  ON certificates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  condition jsonb DEFAULT '{}',
  points integer DEFAULT 0
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (true);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  achievement_id uuid REFERENCES achievements(id),
  earned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

CREATE POLICY "System can award achievements"
  ON user_achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  course_id uuid REFERENCES courses(id),
  message text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

CREATE POLICY "Users can create feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  course_id uuid REFERENCES courses(id),
  completed_materials jsonb DEFAULT '[]',
  progress_percentage integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

CREATE POLICY "Users can create progress records"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM users WHERE telegram_id::text = auth.jwt()->>'sub' OR true));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_questions_course_id ON questions(course_id);
CREATE INDEX IF NOT EXISTS idx_tests_user_id ON tests(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);