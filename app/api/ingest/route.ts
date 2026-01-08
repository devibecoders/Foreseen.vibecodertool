import { NextResponse } from 'next/server'
import { ingestFromSources } from '@/lib/ingest'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const daysBack = body.daysBack || parseInt(process.env.WEEKLY_DAYS || '7')

    const result = await ingestFromSources(daysBack)

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to trigger ingest',
    defaultDaysBack: parseInt(process.env.WEEKLY_DAYS || '7')
  })
}
