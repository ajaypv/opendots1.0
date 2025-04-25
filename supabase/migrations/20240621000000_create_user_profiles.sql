-- Creation of user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Add any additional profile fields here
  
  CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_]+$')
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Row Level Security policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY read_own_profile ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for users to update their own profile  
CREATE POLICY update_own_profile ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for allowing insert only once for each user
CREATE POLICY insert_own_profile ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add function to check if username is available
CREATE OR REPLACE FUNCTION is_username_available(username_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  username_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE username = username_to_check
  ) INTO username_exists;
  
  RETURN NOT username_exists;
END;
$$; 