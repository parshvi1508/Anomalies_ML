// src/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

interface RecommendationRequest {
  user_id: string
  top_n?: number
  explanation?: boolean
  algorithm?: 'hybrid' | 'content-based' | 'collaborative'
}

// interface AtRiskRecommendationRequest {
//   user_id: string
//   risk_factors: {
//     low_gpa?: boolean
//     poor_attendance?: boolean
//     low_engagement?: boolean
//     failed_courses?: boolean
//   }
//   top_n?: number
// }

/**
 * POST /api/recommendations
 * Get personalized course recommendations for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json()
    
    if (!body.user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const pythonScript = path.join(
      process.cwd(),
      'scripts',
      'get_recommendations.py'
    )

    const result = await executePythonRecommender(pythonScript, {
      user_id: body.user_id,
      top_n: body.top_n || 5,
      explanation: body.explanation || false,
      algorithm: body.algorithm || 'hybrid'
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/recommendations?user_id=U001&top_n=5
 * Get recommendations via query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const user_id = searchParams.get('user_id')
    const top_n = parseInt(searchParams.get('top_n') || '5')
    const explanation = searchParams.get('explanation') === 'true'

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      )
    }

    const pythonScript = path.join(
      process.cwd(),
      'scripts',
      'get_recommendations.py'
    )

    const result = await executePythonRecommender(pythonScript, {
      user_id,
      top_n,
      explanation,
      algorithm: 'hybrid'
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error getting recommendations:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
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
