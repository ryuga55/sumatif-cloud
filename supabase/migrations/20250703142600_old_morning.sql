/*
  # School Management System Database Schema

  1. New Tables
    - `users` - User profiles with role and license information
    - `license_keys` - License key management for SaaS
    - `classes` - School classes management
    - `students` - Student information linked to classes
    - `subjects` - Subject/course management
    - `categories` - Assessment categories (UH, UTS, UAS, etc.)
    - `weights` - Weight percentages for each assessment category
    - `scores` - Student scores for each assessment
    - `attendance` - Student attendance records

  2. Security
    - Enable RLS on all tables
    - Add policies for user data isolation
    - Admin-only access for license management
*/

-- Users table for profile management
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  verified boolean NOT NULL DEFAULT false,
  license_key text,
  created_at timestamptz DEFAULT now()
);

-- License keys table for SaaS management
CREATE TABLE IF NOT EXISTS license_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  nis text NOT NULL,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, nis)
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Categories table (UH1, UH2, UTS, UAS, etc.)
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Weights table (percentage for each category)
CREATE TABLE IF NOT EXISTS weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  weight_percent integer NOT NULL CHECK (weight_percent >= 0 AND weight_percent <= 100),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  assessment_name text NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at timestamptz DEFAULT now()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('sakit', 'izin', 'alfa', 'terlambat', 'hadir')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, student_id, date)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policies for license_keys table (admin only)
CREATE POLICY "Only admins can manage license keys"
  ON license_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policies for classes table
CREATE POLICY "Users can manage own classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for students table
CREATE POLICY "Users can manage own students"
  ON students
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for subjects table
CREATE POLICY "Users can manage own subjects"
  ON subjects
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for categories table
CREATE POLICY "Users can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for weights table
CREATE POLICY "Users can manage own weights"
  ON weights
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for scores table
CREATE POLICY "Users can manage own scores"
  ON scores
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for attendance table
CREATE POLICY "Users can manage own attendance"
  ON attendance
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert initial admin user (optional)
-- You can create this manually through Supabase dashboard
-- INSERT INTO users (id, email, role, verified) VALUES 
-- ('admin-user-id', 'admin@example.com', 'admin', true);

-- Insert some sample license keys for testing
INSERT INTO license_keys (key, is_used) VALUES 
('ABC123', false),
('XYZ789', false),
('DEF456', false);