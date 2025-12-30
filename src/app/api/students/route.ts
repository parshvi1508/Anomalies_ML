// src/app/api/students/route.ts
import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://anomalies-ml.onrender.com';

// Strong typing for each student's data row
interface StudentData {
  student_id?: string;
  name?: string;
  last_active?: string;
  attendance?: string;
  failed_courses?: string;
  gpa?: string;
  risk_score: number;
  risk_category: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Extreme Risk';
  [key: string]: string | number | undefined;
}

// Main GET handler - Proxy to backend
export async function GET(): Promise<NextResponse> {
  try {
    // Proxy to backend
    const response = await fetch(`${API_BASE_URL}/api/students`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Backend request failed' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying student data:', error);
    return NextResponse.json({ error: 'Error fetching student data' }, { status: 500 });
  }
}
