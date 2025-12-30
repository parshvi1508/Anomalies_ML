// src/app/api/recommendations/at-risk/route.ts
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://anomalies-ml.onrender.com';

interface AtRiskRecommendationRequest {
  user_id: string
  risk_factors: {
    low_gpa?: boolean
    poor_attendance?: boolean
    low_engagement?: boolean
    failed_courses?: boolean
  }
  top_n?: number
}

/**
 * POST /api/recommendations/at-risk
 * Proxy to backend for at-risk student recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body: AtRiskRecommendationRequest = await request.json()
    
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    if (!body.risk_factors) {
      return NextResponse.json(
        { error: 'risk_factors is required' },
        { status: 400 }
      )
    }

    // Proxy to backend
    const response = await fetch(`${API_BASE_URL}/api/recommendations/at-risk`, {
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
    console.error('Error proxying at-risk recommendations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get at-risk recommendations' },
      { status: 500 }
    )
  }
}
