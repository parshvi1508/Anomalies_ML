// app/api/students/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';

const filePath = path.join(process.cwd(), 'uploads', 'student_data_with_risk.csv');

export async function GET() {
  return new Promise((resolve) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push({
          ...data,
          risk_score: parseFloat(data.risk_score),
        });
      })
      .on('end', () => {
        const grouped: Record<string, any[]> = {
          'Low Risk': [],
          'Moderate Risk': [],
          'High Risk': [],
          'Extreme Risk': [],
        };
        results.forEach((r) => grouped[r.risk_category].push(r));
        resolve(NextResponse.json(grouped));
      });
  });
}
