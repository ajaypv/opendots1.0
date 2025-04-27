"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { OnboardingFormData } from "@/types/user.types";

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .rpc('is_username_available', { username_to_check: username });
  
  if (error) {
    console.error("Error checking username availability:", error);
    return false;
  }
  
  return data as boolean;
};

/**
 * Check if the current user has completed the onboarding process
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // Check if the user has an onboarding profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error("Error checking onboarding status:", error);
    return false;
  }
  
  return !!data;
};

/**
 * Get the user's onboarding profile if it exists
 */
export const getUserOnboardingProfile = async () => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Get the user's onboarding profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error("Error getting onboarding profile:", error);
    return null;
  }
  
  return data;
};

/**
 * Complete the onboarding process
 */
export const completeOnboarding = async (formData: OnboardingFormData) => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated" };
  }
  
  // Check if the user has already completed onboarding
  const existing = await getUserOnboardingProfile();
  if (existing) {
    return { error: "Onboarding already completed" };
  }
  
  // Check if the username is available
  const usernameAvailable = await checkUsernameAvailability(formData.username);
  if (!usernameAvailable) {
    return { error: "Username is already taken" };
  }
  
  // Create the onboarding profile
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: user.id,
      username: formData.username,
      display_name: formData.display_name,
      age: formData.age ?? null,
      gender: formData.gender ?? null,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error completing onboarding:", error);
    return { error: error.message };
  }
  
  // Revalidate paths to update UI
  revalidatePath('/');
  revalidatePath('/onboarding');
  revalidatePath('/protected');
  
  return { data };
};

/**
 * Update the user's profile (except username which cannot be changed)
 */
export const updateUserProfile = async (formData: Omit<OnboardingFormData, 'username'>) => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated" };
  }
  
  // Update the profile
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      display_name: formData.display_name,
      age: formData.age ?? null,
      gender: formData.gender ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating profile:", error);
    return { error: error.message };
  }
  
  // Revalidate paths to update UI
  revalidatePath('/');
  revalidatePath('/edit-profile');
  revalidatePath('/protected');
  
  return { data };
}; 