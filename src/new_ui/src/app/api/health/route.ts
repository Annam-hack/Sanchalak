import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Sanchalak Frontend',
    timestamp: new Date().toISOString(),
    features: {
      graphql_integration: true,
      voice_input: true,
      real_time_chat: true,
      multi_language: true
    }
  });
} 