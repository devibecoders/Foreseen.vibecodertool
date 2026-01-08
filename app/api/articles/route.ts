import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const minImpactScore = searchParams.get('minImpactScore')

    const articles = await prisma.article.findMany({
      where: {
        ...(startDate && endDate ? {
          publishedAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          }
        } : {}),
        analysis: {
          ...(category ? {
            categories: {
              contains: category
            }
          } : {}),
          ...(minImpactScore ? {
            impactScore: {
              gte: parseInt(minImpactScore)
            }
          } : {})
        }
      },
      include: {
        analysis: true
      },
      orderBy: [
        { publishedAt: 'desc' }
      ]
    })

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('Articles fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
