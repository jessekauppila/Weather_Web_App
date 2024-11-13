import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
  cron: '1,10,30 * * * *'
};

export default async function handler(req: NextRequest) {
  try {
    console.log('Starting cron job execution at:', new Date().toISOString());
    
    const apiUrl = new URL('/api/uploadDataLastHour', req.url);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const result = await response.json();
    console.log('Cron job result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { 
        error: 'Cron job execution failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
