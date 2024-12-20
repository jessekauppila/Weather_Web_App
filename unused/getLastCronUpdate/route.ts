import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  const lastUpdate = await kv.get('lastCronUpdate');
  return NextResponse.json({ lastUpdate });
}