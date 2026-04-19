import { NextRequest, NextResponse } from 'next/server'

// Mock database - replace with your actual DB
const mockLogs = [
  {
    id: "1",
    timestamp: new Date().toISOString(),
    method: "POST",
    endpoint: "/api/v2/users/auth",
    statusCode: 200,
    latencyMs: 94,
    size: "1.2kb",
    responseBody: '{"status":"success","data":{"user_id":"usr_01hx..."}}',
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    method: "GET",
    endpoint: "/api/v1/products",
    statusCode: 200,
    latencyMs: 43,
    size: "8.4kb",
  },
  // Add more mock data or connect to your Go backend
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const endpoint = searchParams.get('endpoint')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  let filtered = [...mockLogs]
  
  if (endpoint) {
    filtered = filtered.filter(log => log.endpoint.includes(endpoint))
  }
  
  if (status) {
    const statusCode = parseInt(status)
    filtered = filtered.filter(log => log.statusCode === statusCode)
  }
  
  return NextResponse.json({ 
    logs: filtered.slice(0, limit),
    total: filtered.length 
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const newLog = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...body
  }
  
  // In production, save to database
  mockLogs.unshift(newLog)
  
  return NextResponse.json({ success: true, log: newLog })
}