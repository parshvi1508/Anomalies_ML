// src/app/api/placeholder-plot/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'default'
  
  // Return a simple SVG placeholder for now
  const svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc"/>
      <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#64748b">
        ${type.charAt(0).toUpperCase() + type.slice(1)} Plot
      </text>
      <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="16" fill="#94a3b8">
        Generated from uploaded CSV data
      </text>
    </svg>
  `
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
    },
  })
}
