import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data with image
    const formData = await request.formData();
    const imageFile = formData.get('file') as File | null;
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Generate a unique ID to prevent collisions
    const uniqueId = uuidv4().substring(0, 8);
    const originalName = imageFile.name;
    const sanitizedFilename = originalName.replace(/[^a-zA-Z0-9\-\_\.]/g, '');
    const key = `${user.id}/${uniqueId}-${sanitizedFilename}`;
    
    // Get the file data
    const fileBuffer = await imageFile.arrayBuffer();
    
    // Upload to R2 using Cloudflare MCP tools
    try {
      const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
      const bucketName = 'profile-images';
      
      if (!accountId) {
        return NextResponse.json({ error: 'Cloudflare Account ID not configured' }, { status: 500 });
      }

      // Use Cloudflare MCP
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;
      
      if (!apiToken) {
        return NextResponse.json({ error: 'Cloudflare API token not configured' }, { status: 500 });
      }
      
      // Upload file to R2 using Cloudflare API
      const r2ApiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${key}`;
      const uploadResponse = await fetch(r2ApiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': imageFile.type
        },
        body: fileBuffer
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Failed to upload to R2: ${uploadResponse.status} ${errorText}`);
      }
      
      // Generate URL for the uploaded image
      const cdnUrl = `https://opendots-alphav1.pages.dev/images/${key}`;
      
      // Return the successful response with the image URL
      return NextResponse.json({
        success: true,
        url: cdnUrl,
        key
      });
    } catch (uploadError) {
      console.error('Error uploading to R2:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in image upload API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 