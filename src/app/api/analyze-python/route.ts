// src/app/api/analyze-python/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

// Define interface for Python analysis results
interface PythonAnalysisResult {
  overview?: {
    total_records: number;
    columns: string[];
    missing_values: { [key: string]: number };
  };
  statistics?: { [key: string]: any };
  visualizations?: { [key: string]: any };
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 })
    }

    // Save uploaded CSV temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempDir = path.join(process.cwd(), 'temp')
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    tempFilePath = path.join(tempDir, `${Date.now()}_${file.name}`)
    fs.writeFileSync(tempFilePath, buffer)

    console.log('Executing Python script with file:', tempFilePath)

    // Execute Python script
    const pythonResults = await executePythonAnalysis(tempFilePath)
    
    // Clean up temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
    }
    
    return NextResponse.json(pythonResults)
  } catch (error) {
    console.error('Error processing file:', error)
    
    // Clean up temp file in case of error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath)
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError)
      }
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process file' 
    }, { status: 500 })
  }
}

function executePythonAnalysis(csvPath: string): Promise<PythonAnalysisResult> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'explore_student_data.py')
    
    // Check if Python script exists
    if (!fs.existsSync(pythonScript)) {
      reject(new Error(`Python script not found: ${pythonScript}`))
      return
    }
    
    console.log('Running Python script:', pythonScript)
    console.log('With CSV file:', csvPath)
    
    // Set environment variables for proper encoding
    const env = { 
      ...process.env, 
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1'
    }
    
    const pythonProcess = spawn('python', [pythonScript, csvPath], {
      env: env,
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    let dataString = ''
    let errorString = ''
    
    pythonProcess.stdout.on('data', (data: Buffer) => {
      dataString += data.toString('utf8')
    })
    
    pythonProcess.stderr.on('data', (data: Buffer) => {
      errorString += data.toString('utf8')
      console.error('Python stderr:', data.toString('utf8'))
    })
    
    pythonProcess.on('close', (code: number | null) => {
      console.log('Python process closed with code:', code)
      console.log('Python stdout:', dataString)
      
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}: ${errorString}`))
        return
      }
      
      try {
        // Find the JSON part in the output (in case there are print statements)
        const lines = dataString.split('\n')
        let jsonLine = ''
        
        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('{') && trimmed.includes('"overview"')) {
            jsonLine = trimmed
            break
          }
        }
        
        if (!jsonLine) {
          // If we can't find a clear JSON line, try to parse the entire output
          jsonLine = dataString.trim()
        }
        
        if (!jsonLine) {
          reject(new Error('No output received from Python script'))
          return
        }
        
        const results: PythonAnalysisResult = JSON.parse(jsonLine)
        resolve(results)
      } catch (parseError) {
        console.error('Failed to parse Python output:', dataString)
        console.error('Parse error:', parseError)
        reject(new Error(`Failed to parse Python output: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`))
      }
    })
    
    pythonProcess.on('error', (error: Error) => {
      console.error('Python process error:', error)
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
    
    // Set a timeout for the Python process (optional)
    const timeout = setTimeout(() => {
      pythonProcess.kill('SIGTERM')
      reject(new Error('Python script execution timed out'))
    }, 60000) // 60 seconds timeout
    
    pythonProcess.on('close', () => {
      clearTimeout(timeout)
    })
  })
}