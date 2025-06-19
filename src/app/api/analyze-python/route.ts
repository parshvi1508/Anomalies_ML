// src/app/api/analyze-python/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Save uploaded CSV temporarily
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tempDir = path.join(process.cwd(), 'temp')
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
    
    const tempFilePath = path.join(tempDir, `${Date.now()}_${file.name}`)
    fs.writeFileSync(tempFilePath, buffer)

    console.log('Executing Python script with file:', tempFilePath)

    // Execute Python script
    const pythonResults = await executePythonAnalysis(tempFilePath)
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath)
    
    return NextResponse.json(pythonResults)
  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to process file' 
    }, { status: 500 })
  }
}

function executePythonAnalysis(csvPath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(process.cwd(), 'scripts', 'explore_student_data.py')
    
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
    
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString('utf8')
    })
    
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString('utf8')
      console.error('Python stderr:', data.toString('utf8'))
    })
    
    pythonProcess.on('close', (code) => {
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
        
        const results = JSON.parse(jsonLine)
        resolve(results)
      } catch (error) {
        console.error('Failed to parse Python output:', dataString)
        console.error('Parse error:', error)
        reject(new Error('Failed to parse Python output'))
      }
    })
    
    pythonProcess.on('error', (error) => {
      console.error('Python process error:', error)
      reject(new Error(`Failed to start Python process: ${error.message}`))
    })
  })
}