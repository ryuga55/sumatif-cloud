import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  role: 'admin' | 'user'
  verified: boolean
  license_key?: string
  created_at: string
}

export interface LicenseKey {
  id: string
  key: string
  is_used: boolean
  assigned_user_id?: string
  created_at: string
}

export interface Class {
  id: string
  user_id: string
  name: string
  is_active: boolean
  created_at: string
}

export interface Student {
  id: string
  user_id: string
  name: string
  nis: string
  class_id: string
  created_at: string
  class?: Class
}

export interface Subject {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  description: string
  created_at: string
}

export interface Weight {
  id: string
  user_id: string
  category_id: string
  weight_percent: number
  created_at: string
  category?: Category
}

export interface Score {
  id: string
  user_id: string
  student_id: string
  subject_id: string
  category_id: string
  assessment_name: string
  score: number
  created_at: string
  student?: Student
  subject?: Subject
  category?: Category
}

export interface Attendance {
  id: string
  user_id: string
  student_id: string
  date: string
  status: 'sakit' | 'izin' | 'alfa' | 'terlambat' | 'hadir'
  created_at: string
  student?: Student
}