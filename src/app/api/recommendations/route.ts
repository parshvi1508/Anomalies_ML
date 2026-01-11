// src/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://anomalies-ml.onrender.com';

/**
 * POST /api/recommendations
 * Proxy to backend API for personalized course recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Proxy to backend
    const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend request failed' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying recommendations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/recommendations?user_id=U001&top_n=5
 * Proxy GET requests to backend
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const user_id = searchParams.get('user_id')
    const top_n = searchParams.get('top_n') || '5'

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      )
    }

    // Proxy to backend
    const url = new URL(`${API_BASE_URL}/api/recommendations`);
    url.searchParams.set('user_id', user_id);
    url.searchParams.set('top_n', top_n);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend request failed' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying recommendations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}
