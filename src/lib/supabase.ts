import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Student {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  student_id: string;
  desired_country: string;
  desired_college: string;
  education_level: string;
  field_of_study: string;
  passport_url: string;
  transcripts_url: string;
  motivation_letter_url: string;
  status: 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Admin {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}
