// src/app/api/students/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';

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

// Groups of students by risk
interface GroupedStudents {
  'Low Risk': StudentData[];
  'Moderate Risk': StudentData[];
  'High Risk': StudentData[];
  'Extreme Risk': StudentData[];
}

// File location
const filePath = path.join(process.cwd(), 'uploads', 'student_data_with_risk.csv');

// Main GET handler
export async function GET(): Promise<NextResponse> {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Student data file not found' }, { status: 404 });
    }

    const results: StudentData[] = await new Promise((resolve, reject) => {
      const data: StudentData[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row: Record<string, string>) => {
          const parsedStudent: StudentData = {
            ...row,
            risk_score: parseFloat(row.risk_score),
            risk_category: row.risk_category as StudentData['risk_category'],
          };
          data.push(parsedStudent);
        })
        .on('end', () => resolve(data))
        .on('error', (error: Error) => reject(error));
    });

    // Initialize groups
    const grouped: GroupedStudents = {
      'Low Risk': [],
      'Moderate Risk': [],
      'High Risk': [],
      'Extreme Risk': [],
    };

    results.forEach((student) => {
      if (grouped[student.risk_category]) {
        grouped[student.risk_category].push(student);
      }
    });

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error processing student data:', error);
    return NextResponse.json({ error: 'Error processing student data' }, { status: 500 });
  }
}
