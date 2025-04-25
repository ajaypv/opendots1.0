"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
