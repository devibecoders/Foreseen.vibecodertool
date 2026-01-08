import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scanId = searchParams.get('scanId')

    if (scanId) {
      const scan = await prisma.scan.findUnique({
        where: { id: scanId },
        include: {
          articles: {
            include: {
              analysis: true
            },
            orderBy: { publishedAt: 'desc' }
          }
        }
      })

      if (!scan) {
        return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
      }

      return NextResponse.json({ scan })
    }

    const scans = await prisma.scan.findMany({
      orderBy: { startedAt: 'desc' },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    })

    return NextResponse.json({ scans })
  } catch (error) {
    console.error('Scans fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
