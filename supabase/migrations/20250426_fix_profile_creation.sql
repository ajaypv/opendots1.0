-- Fix issue with profiles not being created for existing users
-- Add missing profiles for existing users

-- First, let's ensure our trigger function is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    avatar_url, 
    provider,
    location,
    platform,
    browser
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider',
    COALESCE(new.raw_user_meta_data->>'location', 'unknown'),
    COALESCE(new.raw_user_meta_data->>'platform', 'unknown'),
    COALESCE(new.raw_user_meta_data->>'browser', 'unknown')
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's using our updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to populate profiles for existing users
CREATE OR REPLACE FUNCTION public.populate_missing_profiles()
RETURNS void AS $$
DECLARE
  usr RECORD;
BEGIN
  FOR usr IN 
    SELECT * FROM auth.users
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE profiles.id = users.id
    )
  LOOP
    INSERT INTO public.profiles (
      id, 
      email, 
      full_name, 
      avatar_url, 
      provider,
      location,
      platform,
      browser
    )
    VALUES (
      usr.id,
      usr.email,
      usr.raw_user_meta_data->>'full_name',
      usr.raw_user_meta_data->>'avatar_url',
      usr.raw_app_meta_data->>'provider',
      'unknown',
      'unknown',
      'unknown'
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to populate missing profiles
SELECT public.populate_missing_profiles();

-- Grant appropriate permissions
ALTER FUNCTION public.populate_missing_profiles() OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.populate_missing_profiles() TO postgres;
GRANT EXECUTE ON FUNCTION public.populate_missing_profiles() TO service_role;

-- Create a secure function to update user profile with metadata
CREATE OR REPLACE FUNCTION public.update_user_profile_metadata(
  user_id UUID,
  p_platform TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
  SET 
    platform = COALESCE(p_platform, platform),
    browser = COALESCE(p_browser, browser),
    location = COALESCE(p_location, location),
    updated_at = now()
  WHERE id = user_id;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on the update function
ALTER FUNCTION public.update_user_profile_metadata(UUID, TEXT, TEXT, TEXT) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.update_user_profile_metadata(UUID, TEXT, TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION public.update_user_profile_metadata(UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_profile_metadata(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Add policies to allow the service role to manage profiles
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 