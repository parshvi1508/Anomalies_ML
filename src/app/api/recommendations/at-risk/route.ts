// src/app/api/recommendations/at-risk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

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
 * Get specialized recommendations for at-risk students
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
        { error: 'risk_factors are required' },
        { status: 400 }
      )
    }

    const pythonScript = path.join(
      process.cwd(),
      'scripts',
      'get_at_risk_recommendations.py'
    )

    const result = await executePythonRecommender(pythonScript, {
      user_id: body.user_id,
      risk_factors: body.risk_factors,
      top_n: body.top_n || 5
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting at-risk recommendations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get at-risk recommendations' },
      { status: 500 }
    )
  }
}

function executePythonRecommender(
  scriptPath: string,
  params: Record<string, unknown>
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const args = [
      scriptPath,
      JSON.stringify(params)
    ]

    const pythonProcess = spawn('python', args, {
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python stderr:', stderr)
        reject(new Error(`Python script failed with code ${code}`))
        return
      }

      try {
        const result = JSON.parse(stdout)
        resolve(result)
      } catch {
        console.error('Failed to parse Python output:', stdout)
        reject(new Error('Invalid JSON response from Python script'))
      }
    })

    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
  })
}
