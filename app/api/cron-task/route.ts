//this is

import { NextRequest, NextResponse } from 'next/server';

// New way to specify runtime and cron config
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;  // 5 minutes in seconds

// Cron schedule using a separate config object
export const preferredRegion = 'auto';
export const schedule = '1,10,30 * * * *';

export async function GET(req: NextRequest) {
  const currentTime = new Date();
  
  try {
    console.log(`[CRON] Job started at ${currentTime.toISOString()} UTC`);
    
    const apiUrl = new URL('/api/uploadDataLastHour', req.url);
    console.log(`[CRON] Calling API endpoint: ${apiUrl.toString()}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`[CRON] HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    console.log('[CRON] Job result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: currentTime.toISOString()
    });
  } catch (error) {
    console.error('[CRON] Job failed:', error);
    return NextResponse.json(
      { 
        error: 'Cron job execution failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}