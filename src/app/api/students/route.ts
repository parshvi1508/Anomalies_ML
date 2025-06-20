// app/api/students/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';

// Define interfaces for better type safety
interface StudentData {
  risk_score: number;
  risk_category: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Extreme Risk';
  [key: string]: any;
}

interface GroupedStudents {
  'Low Risk': StudentData[];
  'Moderate Risk': StudentData[];
  'High Risk': StudentData[];
  'Extreme Risk': StudentData[];
}

const filePath = path.join(process.cwd(), 'uploads', 'student_data_with_risk.csv');

export async function GET(): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    const results: StudentData[] = [];
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      reject(NextResponse.json({ error: 'Student data file not found' }, { status: 404 }));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: { [key: string]: string }) => {
        results.push({
          ...data,
          risk_score: parseFloat(data.risk_score),
        } as StudentData);
      })
      .on('end', () => {
        try {
          const grouped: GroupedStudents = {
            'Low Risk': [],
            'Moderate Risk': [],
            'High Risk': [],
            'Extreme Risk': [],
          };
          
          results.forEach((student) => {
            if (student.risk_category in grouped) {
              grouped[student.risk_category].push(student);
            }
          });
          
          resolve(NextResponse.json(grouped));
        } catch (error) {
          reject(NextResponse.json({ error: 'Error processing student data' }, { status: 500 }));
        }
      })
      .on('error', (error: Error) => {
        console.error('Error reading CSV file:', error);
        reject(NextResponse.json({ error: 'Error reading student data file' }, { status: 500 }));
      });
  });
}