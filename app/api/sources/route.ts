import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ sources })
  } catch (error) {
    console.error('Sources fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const source = await prisma.source.create({
      data: {
        name: body.name,
        type: body.type,
        url: body.url || null,
        query: body.query || null,
        enabled: body.enabled ?? true,
      }
    })

    return NextResponse.json({ source })
  } catch (error) {
    console.error('Source creation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    
    const source = await prisma.source.update({
      where: { id: body.id },
      data: {
        name: body.name,
        type: body.type,
        url: body.url || null,
        query: body.query || null,
        enabled: body.enabled,
      }
    })

    return NextResponse.json({ source })
  } catch (error) {
    console.error('Source update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
