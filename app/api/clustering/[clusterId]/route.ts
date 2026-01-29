/**
 * API: Get cluster details and articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { getClusterArticles } from '@/lib/clustering'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clusterId: string }> }
) {
  try {
    const { clusterId } = await params
    
    if (!clusterId) {
      return NextResponse.json(
        { error: 'clusterId is required' },
        { status: 400 }
      )
    }
    
    const articles = await getClusterArticles(clusterId)
    
    return NextResponse.json({
      clusterId,
      articles,
      count: articles.length
    })
  } catch (error) {
    console.error('Fetch cluster error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch cluster' },
      { status: 500 }
    )
  }
}
