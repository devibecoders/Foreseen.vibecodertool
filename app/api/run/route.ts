import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ingestFromSources, deduplicateArticles } from '@/lib/ingest'
import { llmService } from '@/lib/llm'
import { AsyncQueue } from '@/lib/queue'

export async function POST(request: Request) {
  const scan = await prisma.scan.create({
    data: {
      status: 'running',
      startedAt: new Date(),
    }
  })

  try {
    const body = await request.json().catch(() => ({}))
    const daysBack = body.daysBack || parseInt(process.env.WEEKLY_DAYS || '7')

    console.log(`[Scan ${scan.id}] Starting scan at ${new Date().toISOString()}`)
    console.log(`OpenAI Key present: ${process.env.OPENAI_API_KEY ? 'YES' : 'NO'}`)

    console.log('[1/4] Ingesting articles...')
    const ingestResult = await ingestFromSources(daysBack)
    console.log(`Fetched: ${ingestResult.itemsFetched}, New: ${ingestResult.itemsNew}`)

    console.log('[2/4] Linking new articles to scan...')
    const newArticles = await prisma.article.findMany({
      where: {
        scanId: null,
        createdAt: {
          gte: scan.startedAt
        }
      }
    })
    
    for (const article of newArticles) {
      await prisma.article.update({
        where: { id: article.id },
        data: { scanId: scan.id }
      })
    }
    console.log(`Linked ${newArticles.length} articles to scan ${scan.id}`)

    console.log('[3/4] Deduplicating...')
    const duplicatesRemoved = await deduplicateArticles()
    console.log(`Removed ${duplicatesRemoved} duplicates`)

    console.log('[4/4] Analyzing articles...')
    const articlesWithoutAnalysis = await prisma.article.findMany({
      where: {
        analysis: null
      },
      orderBy: { publishedAt: 'desc' },
      take: 50
    })

    console.log(`Found ${articlesWithoutAnalysis.length} articles to analyze`)
    
    for (const article of articlesWithoutAnalysis) {
      if (!article.scanId) {
        await prisma.article.update({
          where: { id: article.id },
          data: { scanId: scan.id }
        })
      }
    }

    const maxParallel = parseInt(process.env.MAX_PARALLEL_LLM_CALLS || '3')
    const queue = new AsyncQueue(maxParallel)
    let analyzed = 0
    const errors: string[] = []

    const analysisPromises = articlesWithoutAnalysis.map(article =>
      queue.add(async () => {
        try {
          console.log(`Analyzing: ${article.title.substring(0, 50)}...`)
          const analysis = await llmService.analyzeArticle(
            article.title,
            article.url,
            article.rawContent || undefined
          )

          await prisma.analysis.create({
            data: {
              articleId: article.id,
              summary: analysis.summary,
              categories: analysis.categories.join(','),
              impactScore: analysis.impactScore,
              relevanceReason: analysis.relevanceReason,
              customerAngle: analysis.customerAngle,
              vibecodersAngle: analysis.vibecodersAngle,
              keyTakeaways: analysis.keyTakeaways.join('|||'),
            }
          })

          analyzed++
          console.log(`✓ Analyzed ${analyzed}/${articlesWithoutAnalysis.length}`)
        } catch (error) {
          const errorMsg = `Failed to analyze "${article.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      })
    )

    await Promise.all(analysisPromises)
    await queue.waitForAll()

    console.log('[5/5] Complete!')

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        itemsFetched: ingestResult.itemsFetched,
        itemsAnalyzed: analyzed,
      }
    })

    return NextResponse.json({
      success: true,
      scanId: scan.id,
      scanDate: scan.startedAt,
      itemsFetched: ingestResult.itemsFetched,
      itemsNew: ingestResult.itemsNew,
      duplicatesRemoved,
      itemsAnalyzed: analyzed,
      errors: [...ingestResult.errors, ...errors],
    })
  } catch (error) {
    console.error('Scan error:', error)
    
    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }
    })

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
  const lastRun = await prisma.runLog.findFirst({
    orderBy: { startedAt: 'desc' }
  })

  return NextResponse.json({ 
    message: 'Use POST to trigger weekly scan',
    lastRun
  })
}
