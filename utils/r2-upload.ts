'use server';

import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Cloudflare R2 storage
 * This function uses Cloudflare API to upload files to R2 storage
 */
export async function uploadToR2(
  file: ArrayBuffer,
  fileName: string,
  contentType: string,
  directory: string = ''
): Promise<{ success: boolean; url: string; key: string }> {
  try {
    // Generate a unique ID to prevent collisions
    const uniqueId = uuidv4().substring(0, 8);
    const sanitizedFilename = fileName.replace(/[^a-zA-Z0-9\-\_\.]/g, '');
    const key = directory ? 
      `${directory}/${uniqueId}-${sanitizedFilename}` : 
      `${uniqueId}-${sanitizedFilename}`;

    // Convert ArrayBuffer to Blob for upload
    const blob = new Blob([file], { type: contentType });

    // Include account ID and bucket name in the URL for upload
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const bucketName = 'profile-images';
    
    if (!accountId) {
      throw new Error('Cloudflare Account ID not configured');
    }

    // Format the R2 URL and public URL
    const r2ApiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${key}`;
    const cdnUrl = `https://opendots-alphav1.pages.dev/images/${key}`;
    
    // Get API token from environment
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (!apiToken) {
      throw new Error('Cloudflare API token not configured');
    }
    
    // Upload file to R2 using Cloudflare API
    const uploadResponse = await fetch(r2ApiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': contentType
      },
      body: file
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload to R2: ${uploadResponse.status} ${errorText}`);
    }
    
    return {
      success: true,
      url: cdnUrl,
      key
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
} 