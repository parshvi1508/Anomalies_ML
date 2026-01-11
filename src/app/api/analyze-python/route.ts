// src/app/api/analyze-python/route.ts
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'https://anomalies-ml.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      )
    }

    // Proxy to backend with extended timeout
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        body: backendFormData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Backend analysis failed' }));
        return NextResponse.json(error, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Analysis timeout. File processing took too long.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error proxying analysis:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze file' },
      { status: 500 }
    )
  }
}
