// app/api/students/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

// Store the CSV data in memory (this will reset on each deployment)
let csvData: any[] | null = null;

export async function GET() {
  try {
    // If we already have the data in memory, return it
    if (csvData) {
      return NextResponse.json(csvData);
    }
    
    // If no data in memory, return empty array or error
    return NextResponse.json([], { status: 404 });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Read file content
    const fileContent = await file.text();
    
    // Parse CSV
    const { data, errors } = Papa.parse(fileContent, { 
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    if (errors.length > 0) {
      console.error('CSV parsing errors:', errors);
      return NextResponse.json(
        { error: 'CSV parsing failed', details: errors },
        { status: 400 }
      );
    }
    
    // Store in memory
    csvData = data;
    
    return NextResponse.json({ 
      message: 'CSV uploaded successfully',
      recordCount: data.length 
    });
    
  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}