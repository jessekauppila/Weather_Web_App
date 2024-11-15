import { NextRequest } from 'next/server';
import { GET } from '../app/api/cron-task/cron';

async function testCron() {
  // Create minimal NextRequest mock
  const req = new Request('http://localhost:3000') as unknown as NextRequest;
  
  try {
    const response = await GET(req);
    const data = await response.json();
    console.log('Cron job result:', data);
  } catch (error) {
    console.error('Cron job failed:', error);
  }
}

testCron(); 