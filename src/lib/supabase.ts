import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  points: number;
  level: number;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  description?: string;
  category: string;
  content_type: string;
  content_url?: string;
  thumbnail_url?: string;
  difficulty: string;
  created_at: string;
};

export type Question = {
  id: string;
  course_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'open';
  options?: { text: string; is_correct?: boolean }[];
  correct_answer?: string;
  difficulty: string;
};

export type Test = {
  id: string;
  course_id: string;
  user_id: string;
  questions: Question[];
  status: 'in_progress' | 'completed';
  created_at: string;
};

export type TestResult = {
  id: string;
  test_id: string;
  user_id: string;
  course_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: any[];
  passed: boolean;
  points_earned: number;
  completed_at: string;
};

export type Certificate = {
  id: string;
  user_id: string;
  course_id: string;
  test_result_id: string;
  certificate_number: string;
  issued_at: string;
};

export type Achievement = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  condition: any;
  points: number;
};

export type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
};
