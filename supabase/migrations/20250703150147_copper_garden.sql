/*
  # Fix Users Table RLS Policies

  1. Security Updates
    - Update RLS policies for `users` table to allow authenticated users to insert their own profile
    - Ensure users can only access and modify their own data
    - Fix the restrictive policies that prevent user profile creation

  2. Changes
    - Drop existing restrictive policies
    - Create new policies that allow:
      - INSERT: Users can create their own profile (auth.uid() = id)
      - SELECT: Users can read their own profile
      - UPDATE: Users can update their own profile
*/

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies that allow proper user management
CREATE POLICY "Enable insert for authenticated users on their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for authenticated users on their own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update for authenticated users on their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);