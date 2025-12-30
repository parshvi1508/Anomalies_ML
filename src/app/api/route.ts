import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    // Proxy to backend health check
    const response = await fetch(`${API_BASE_URL}/`);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Backend connection failed' }, { status: 503 });
  }
}
