// app/api/teamRows/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  // console.log("DATABASE_URL from API route:")
  try {
    const events = await prisma.event.findMany()
    
    return NextResponse.json(events)
  } catch (err) {
    // console.error("Error in GET /api/teamRows:", err)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
