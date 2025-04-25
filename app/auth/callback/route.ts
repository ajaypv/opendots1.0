import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get("next") ?? "/protected";

  // Get platform, browser, and location from URL parameters
  const platform = requestUrl.searchParams.get("platform");
  const browser = requestUrl.searchParams.get("browser");
  const location = requestUrl.searchParams.get("location");

  // If there's no code, redirect to error page
  if (!code) {
    console.error("No code provided in OAuth callback");
    return NextResponse.redirect(`${origin}/?error=true&message=Missing+authorization+code&type=error`);
  }

  try {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error.message);
      return NextResponse.redirect(`${origin}/?error=true&message=${encodeURIComponent(error.message)}&type=error`);
    }

    // Check if this is a new user by checking created_at vs updated_at timestamps
    // If they're very close, it's likely a new user
    let isNewUser = false;
    let redirectPath = next;
    
    if (data?.user) {
      try {
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', data.user.id)
          .single();
          
        // Check if profile data is incomplete (new user or not onboarded)
        if (!profileError && (!profileData.username || !profileData.full_name)) {
          isNewUser = true;
          redirectPath = '/onboarding';
        }
        
        // Check user metadata for onboarding status
        const userMetadata = data.user.user_metadata;
        if (!userMetadata.onboarded) {
          isNewUser = true;
          redirectPath = '/onboarding';
        }
        
        // Use the user info from URL parameters
        const userInfo = {
          platform: platform || 'unknown',
          browser: browser || 'unknown',
          location: location || 'unknown'
        };

        // Update the profile with device information using our secure function
        const { data: profileResult, error: profileError2 } = await supabase.rpc(
          'update_user_profile_metadata',
          {
            user_id: data.user.id,
            p_platform: userInfo.platform,
            p_browser: userInfo.browser,
            p_location: userInfo.location
          }
        );

        if (profileError2) {
          console.error("Error updating profile:", profileError2.message);
        } else {
          console.log("Profile updated successfully");
        }

        // Also update the user's metadata for future use
        await supabase.auth.updateUser({
          data: {
            platform: userInfo.platform,
            browser: userInfo.browser,
            location: userInfo.location,
            last_sign_in: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error("Error updating user profile:", err);
      }
    }

    // Use the X-Forwarded-Host header in production environments
    const forwardedHost = request.headers.get('x-forwarded-host'); // Original origin before load balancer
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    let redirectUrl;
    if (isLocalEnv) {
      // Local development - use origin directly
      redirectUrl = `${origin}${redirectPath}`;
    } else if (forwardedHost) {
      // Production with load balancer - use forwarded host
      redirectUrl = `https://${forwardedHost}${redirectPath}`;
    } else {
      // Production without load balancer
      redirectUrl = `${origin}${redirectPath}`;
    }

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("Unexpected error in OAuth callback:", err);
    return NextResponse.redirect(`${origin}/?error=true&message=An+unexpected+error+occurred&type=error`);
  }
}
