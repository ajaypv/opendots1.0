# Cloudflare R2 Setup Guide

This guide explains how to set up Cloudflare R2 storage for profile image uploads in the OpenDots application.

## Prerequisites

1. A Cloudflare account
2. Access to Cloudflare R2 (may require a paid plan)
3. Wrangler CLI installed and authenticated

## Setup Process

### Automatic Setup

We've created a setup script to make the R2 configuration process easier:

```bash
# Run the setup script
pnpm setup-r2
```

This script will:
1. Ask for your Cloudflare Account ID
2. Ask for your Cloudflare API Token with R2 permissions
3. Create the necessary R2 buckets
4. Generate a `.env.local` file with the required configuration

### Manual Setup

If you prefer to set up R2 manually, follow these steps:

1. **Create Cloudflare R2 buckets**

   ```bash
   # Create the main bucket
   npx wrangler r2 bucket create profile-images
   
   # Create the development bucket
   npx wrangler r2 bucket create profile-images-dev
   ```

2. **Create an API token with R2 permissions**

   Go to your Cloudflare dashboard:
   - Navigate to "My Profile" > "API Tokens"
   - Create a new token with "R2 Storage:Edit" permissions
   - Copy the token for use in the next step

3. **Configure environment variables**

   Create a `.env.local` file with the following content:

   ```
   # Cloudflare API Configuration
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   CLOUDFLARE_API_TOKEN=your_api_token_here
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=https://your-app-url.pages.dev
   ```

## How It Works

The application uses the following components for R2 storage:

1. **API Route for Uploads**: `/api/upload` handles image uploads from the client
2. **Image Worker**: Serves images from R2 and handles transformations
3. **R2 Storage**: Stores the actual image files

When a user uploads a profile image:
1. The client sends the image to the `/api/upload` API route
2. The API route authenticates the user and uploads the image to R2
3. The image URL is stored in the user's profile
4. The image is served via the image worker at `/images/:userId/:imageName`

## Troubleshooting

If you encounter issues with R2 uploads:

1. **Check Environment Variables**: Make sure `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` are set correctly
2. **Verify API Token Permissions**: Ensure your API token has R2 Storage:Edit permissions
3. **Check Bucket Existence**: Confirm that the `profile-images` bucket exists
4. **Wrangler Authentication**: Make sure you're logged in with `npx wrangler login`
5. **CORS Issues**: If you see CORS errors, check that your R2 bucket has the appropriate CORS configuration

## Additional Configuration

### Custom Domains

If you're using a custom domain, update the `NEXT_PUBLIC_APP_URL` environment variable to match your domain.

### Image Transformations

The image worker supports basic image transformations via query parameters:

- `?width=300`: Resizes the image to 300px width
- `?height=300`: Resizes the image to 300px height
- `?width=300&height=300`: Resizes to fit within 300x300px 