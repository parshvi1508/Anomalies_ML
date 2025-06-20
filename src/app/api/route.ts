import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';

export async function GET() {
  const filePath = path.join(process.cwd(), 'uploads/student_data_with_risk.csv');
  const csvData = fs.readFileSync(filePath, 'utf8');
  const { data } = Papa.parse(csvData, { header: true });
  return NextResponse.json(data);
}
