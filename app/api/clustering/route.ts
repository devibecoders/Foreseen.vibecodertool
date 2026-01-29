/**
 * API: Clustering / Deduplication
 * POST: Cluster articles from a scan
 * GET: Get deduplicated articles
 */

import { NextRequest, NextResponse } from 'next/server'
import { clusterScanArticles, getDeduplicatedArticles } from '@/lib/clustering'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { scanId } = body
    
    if (!scanId) {
      return NextResponse.json(
        { error: 'scanId is required' },
        { status: 400 }
      )
    }
    
    const stats = await clusterScanArticles(scanId)
    
    return NextResponse.json({
      success: true,
      stats,
      message: `Created ${stats.clustersCreated} clusters from ${stats.articlesInClusters} articles. ${stats.standaloneArticles} standalone articles.`
    })
  } catch (error) {
    console.error('Clustering error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Clustering failed' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const scanId = searchParams.get('scanId') || undefined
    
    const articles = await getDeduplicatedArticles(scanId)
    
    return NextResponse.json({
      articles,
      count: articles.length,
      deduplicated: true
    })
  } catch (error) {
    console.error('Fetch deduplicated articles error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
