"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { OnboardingFormData } from "@/types/user.types";
import { d1Client, isCloudflareWorker } from "@/utils/d1/client";

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
 * Check if a username is available using D1 first, then Supabase
 */
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  // First try D1
  if (isCloudflareWorker()) {
    try {
      const isAvailableInD1 = await d1Client.isUsernameAvailable(username);
      if (!isAvailableInD1) {
        return false; // Username is taken in D1
      }
      // If username is available in D1, we'll also check Supabase for consistency
    } catch (error) {
      console.error("Error checking username availability in D1:", error);
      // Continue to check in Supabase on error
    }
  }
  
  // Check in Supabase as fallback
  const supabase = await createClient();
  const { data: supabaseAvailable, error } = await supabase
    .rpc('is_username_available', { username_to_check: username });
  
  if (error) {
    console.error("Error checking username availability in Supabase:", error);
    return false;
  }
  
  return Boolean(supabaseAvailable);
};

/**
 * Check if the current user has completed the onboarding process
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // First try to check in D1
  if (isCloudflareWorker()) {
    try {
      const profile = await d1Client.getUserProfile(user.id);
      if (profile) {
        return true; // User has completed onboarding in D1
      }
    } catch (error) {
      console.error("Error checking onboarding status in D1:", error);
      // Continue to check in Supabase on error
    }
  }
  
  // Check in Supabase as fallback
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error("Error checking onboarding status in Supabase:", error);
    return false;
  }
  
  return !!data;
};

/**
 * Get the user's onboarding profile if it exists, using D1 first
 */
export const getUserOnboardingProfile = async () => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // First try to get profile from D1
  if (isCloudflareWorker()) {
    try {
      const d1Profile = await d1Client.getUserProfile(user.id);
      if (d1Profile) {
        return d1Profile; // Found in D1, return it
      }
    } catch (error) {
      console.error("Error getting onboarding profile from D1:", error);
      // Continue to check Supabase on error
    }
  }
  
  // Try Supabase as fallback
  const { data: supabaseProfile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (error) {
    console.error("Error getting onboarding profile from Supabase:", error);
    return null;
  }
  
  // If we found a profile in Supabase but not in D1, we should sync it to D1 for next time
  if (supabaseProfile && isCloudflareWorker()) {
    try {
      await d1Client.createUserProfile({
        id: supabaseProfile.id,
        user_id: supabaseProfile.user_id,
        username: supabaseProfile.username,
        display_name: supabaseProfile.display_name,
        age: supabaseProfile.age,
        gender: supabaseProfile.gender,
      });
    } catch (syncError) {
      console.error("Error syncing Supabase profile to D1:", syncError);
    }
  }
  
  return supabaseProfile;
};

/**
 * Complete the onboarding process, using D1 first
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
  
  // Generate a unique ID for the profile
  const profileId = crypto.randomUUID();
  
  let profileData = null;
  let d1Error = null;
  
  // First try to create in D1
  if (isCloudflareWorker()) {
    const d1Result = await d1Client.createUserProfile({
      id: profileId,
      user_id: user.id,
      username: formData.username,
      display_name: formData.display_name,
      age: formData.age ?? null,
      gender: formData.gender ?? null
    });
    
    if (!d1Result.success) {
      d1Error = d1Result.error;
      console.warn("D1 profile creation failed, falling back to Supabase:", d1Error);
    }
  }
  
  // Always create in Supabase for redundancy or as a fallback
  const { data: supabaseProfile, error: supabaseError } = await supabase
    .from('user_profiles')
    .insert({
      id: profileId,
      user_id: user.id,
      username: formData.username,
      display_name: formData.display_name,
      age: formData.age ?? null,
      gender: formData.gender ?? null,
    })
    .select()
    .single();
  
  if (supabaseError) {
    // If both D1 and Supabase failed, return error
    if (d1Error) {
      console.error("Failed to create profile in both D1 and Supabase");
      return { error: `D1: ${d1Error}, Supabase: ${supabaseError.message}` };
    }
    
    // If only Supabase failed but D1 succeeded, log the error but consider it a partial success
    console.error("Error creating profile in Supabase:", supabaseError);
    return { 
      data: { 
        id: profileId,
        user_id: user.id,
        username: formData.username,
        display_name: formData.display_name,
        age: formData.age ?? null,
        gender: formData.gender ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      warning: "Profile created in D1 only, Supabase sync failed"
    };
  }
  
  // Revalidate paths to update UI
  revalidatePath('/');
  revalidatePath('/onboarding');
  revalidatePath('/protected');
  
  return { data: supabaseProfile };
};

/**
 * Update the user's profile (except username), using D1 first
 */
export const updateUserProfile = async (formData: Omit<OnboardingFormData, 'username'>) => {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "User not authenticated" };
  }
  
  let d1Error = null;
  
  // First try to update in D1
  if (isCloudflareWorker()) {
    const d1Result = await d1Client.updateUserProfile(user.id, {
      display_name: formData.display_name,
      age: formData.age ?? null,
      gender: formData.gender ?? null
    });
    
    if (!d1Result.success) {
      d1Error = d1Result.error;
      console.warn("D1 profile update failed, falling back to Supabase:", d1Error);
    }
  }
  
  // Always update in Supabase for redundancy or as fallback
  const { data: updatedProfile, error: supabaseError } = await supabase
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
  
  if (supabaseError) {
    // If both D1 and Supabase failed, return error
    if (d1Error) {
      console.error("Failed to update profile in both D1 and Supabase");
      return { error: `D1: ${d1Error}, Supabase: ${supabaseError.message}` };
    }
    
    // If only Supabase failed but D1 succeeded, log the error but consider it a partial success
    console.error("Error updating profile in Supabase:", supabaseError);
    return { 
      data: {
        display_name: formData.display_name,
        age: formData.age ?? null,
        gender: formData.gender ?? null,
        updated_at: new Date().toISOString(),
      },
      warning: "Profile updated in D1 only, Supabase sync failed"
    };
  }
  
  // Revalidate paths to update UI
  revalidatePath('/');
  revalidatePath('/edit-profile');
  revalidatePath('/protected');
  
  return { data: updatedProfile };
};
