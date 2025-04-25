# Google OAuth Setup Guide

This guide will walk you through the process of setting up Google OAuth for your Supabase application in production.

## Prerequisites

- A Supabase project
- A Google Cloud Platform (GCP) account
- A domain for your application (your production URL)

## Step 1: Create OAuth Credentials in Google Cloud Platform

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** and select **OAuth client ID**
5. Set the application type to **Web application**
6. Add a name for your OAuth client
7. Under **Authorized JavaScript origins**, add:
   - Your production domain (e.g., `https://yourdomain.com`)
   - Your local development URL (e.g., `http://localhost:3000`) if testing locally
8. Under **Authorized redirect URIs**, add:
   - Production: `https://yourdomain.com/auth/callback`
   - Local development: `http://localhost:3000/auth/callback`
9. Click **Create** to generate your OAuth client ID and client secret
10. Save your client ID and client secret for the next step

## Step 2: Configure OAuth in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and click **Enable**
4. Enter the **Client ID** and **Client Secret** from Google Cloud
5. Save the changes

## Step 3: Configure Supabase Redirect URLs

1. Navigate to **Authentication** > **URL Configuration**
2. Add the following redirect URLs to the allowed list:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)
3. Set your **Site URL** to your production URL: `https://yourdomain.com`

## Step 4: Apply Database Schema for Security

Run the SQL migration script in your Supabase SQL editor:

1. Go to the **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase/migrations/20250425_secure_google_auth.sql`
3. Run the query to create the profiles table with proper security policies

## Step 5: Environment Variables

Ensure these environment variables are set in your deployment environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
```

## Security Best Practices

1. **Use HTTPS in production**: Ensure your site uses HTTPS to protect authentication tokens.
2. **Set proper cookie attributes**: The middleware has been configured to set secure cookies with proper attributes in production.
3. **Implement Row Level Security (RLS)**: The SQL migration creates appropriate RLS policies for your profiles table.
4. **Add security headers**: The middleware includes security headers like X-Frame-Options and CSP.
5. **Log authentication errors**: Error handling with proper logging has been implemented in the authentication flow.

## Testing the Integration

1. Start your application
2. Visit the homepage, which will show the Google sign-in button
3. Click the button and complete the Google authentication flow
4. You should be redirected to the protected page after successful authentication

## Troubleshooting

- **Redirect URI mismatch**: Make sure the redirect URI in Google Cloud matches the callback URL in your application and Supabase settings.
- **CORS issues**: Ensure your site URL is correctly set in the Supabase dashboard.
- **Cookie problems**: Check that cookies are being properly stored and retrieved by the middleware.
- **Authentication errors**: Look at browser console and server logs for detailed error messages. 