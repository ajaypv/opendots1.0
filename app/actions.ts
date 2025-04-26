"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { OnboardingFormData } from "@/types/user.types";

type OAuthProvider = "google" | "github" | "linkedin";

export const signInWithOAuthAction = async (
  provider: OAuthProvider,
  userInfo?: { platform?: string; browser?: string; location?: string }
) => {
  const supabase = await createClient();
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  const userAgent = requestHeaders.get("user-agent") || "unknown";
  
  // Get IP address from request if available
  const ip = requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip") || "unknown";

  if (!origin) {
    return encodedRedirect("error", "/", "Missing origin header");
  }

  // Prepare a callback URL with user info as URL parameters
  let callbackUrl = `${origin}/auth/callback`;
  
  // If we have user info, add it to the callback URL as query parameters
  if (userInfo) {
    // Extract the platform from userInfo or try to determine from user agent
    const platform = userInfo.platform || 
      (userAgent?.includes("Mobile") || userAgent?.includes("Android") || userAgent?.includes("iPhone") 
        ? "Mobile" 
        : "Desktop");
        
    // Extract browser information from User-Agent if not provided
    const browser = userInfo.browser || 
      (userAgent?.includes("Chrome") ? "Chrome" : 
       userAgent?.includes("Firefox") ? "Firefox" : 
       userAgent?.includes("Safari") ? "Safari" : 
       userAgent?.includes("Edge") ? "Edge" : 
       "Other Browser");
    
    callbackUrl += `?platform=${encodeURIComponent(platform)}`;
    callbackUrl += `&browser=${encodeURIComponent(browser)}`;
    callbackUrl += `&location=${encodeURIComponent(userInfo.location || 'unknown')}`;
  }

  // Configure provider-specific options
  const providerOptions: Record<OAuthProvider, { scopes: string[] }> = {
    google: {
      scopes: ['profile', 'email']
    },
    github: {
      scopes: ['user:email', 'read:user']
    },
    linkedin: {
      scopes: ['r_liteprofile', 'r_emailaddress']
    }
  };

  // Add additional OAuth scopes to get more user data
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
        scope: providerOptions[provider].scopes.join(' ')
      }
    }
  });

  if (error) {
    console.error(`Error signing in with ${provider}:`, error);
    return encodedRedirect("error", "/", error.message);
  }

  if (data.url) {
    return redirect(data.url);
  } else {
    return encodedRedirect("error", "/", "OAuth configuration error");
  }
};

// For backward compatibility
export const signInWithGoogleAction = async (userInfo?: { platform?: string; browser?: string; location?: string }) => 
  await signInWithOAuthAction("google", userInfo);

// New provider-specific actions
export const signInWithGitHubAction = async (userInfo?: { platform?: string; browser?: string; location?: string }) => 
  await signInWithOAuthAction("github", userInfo);

export const signInWithLinkedInAction = async (userInfo?: { platform?: string; browser?: string; location?: string }) => 
  await signInWithOAuthAction("linkedin", userInfo);

export const signOutAction = async () => {
  const supabase = await createClient();
  
  // Sign out from Supabase with global scope
  const { error } = await supabase.auth.signOut({ 
    scope: 'global' 
  });
  
  if (error) {
    console.error("Error signing out:", error);
  }
  
  // Revalidate the root layout to ensure UI is updated
  revalidatePath('/', 'layout');
  
  // Redirect to sign-in page with signout parameter
  // Our middleware will detect this parameter and clear all auth cookies
  return redirect("/?signout=true");
};

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
