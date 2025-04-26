import { NextRequest, NextResponse } from 'next/server';
import { isCloudflareWorker } from '@/utils/d1/client';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const isD1Available = isCloudflareWorker();
  
  try {
    // Check if we're running in a Cloudflare Worker with D1
    if (!isD1Available) {
      return NextResponse.json({
        status: 'not_available',
        message: 'D1 database is not available in this environment',
        is_worker: false,
        tables: []
      });
    }
    
    // If we are running in a Cloudflare Worker with D1, check the tables
    const tablesStmt = globalThis.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    const tablesResult = await tablesStmt.all<{ name: string }>();
    
    // Also check if we have any user profiles
    const profilesStmt = globalThis.DB.prepare(
      "SELECT COUNT(*) as count FROM user_profiles"
    );
    const profilesResult = await profilesStmt.first<{ count: number }>();
    
    return NextResponse.json({
      status: 'available',
      message: 'D1 database is available',
      is_worker: true,
      tables: tablesResult.results?.map(table => table.name) || [],
      profile_count: profilesResult?.count || 0
    });
  } catch (error) {
    console.error('Error checking D1 status:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error checking D1 status',
      is_worker: isD1Available,
      error: String(error)
    }, { status: 500 });
  }
} 