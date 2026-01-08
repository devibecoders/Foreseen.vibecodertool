import Parser from 'rss-parser'
import { prisma } from './prisma'
import { subDays } from 'date-fns'

const parser = new Parser()

export interface IngestResult {
  itemsFetched: number
  itemsNew: number
  errors: string[]
}

export async function ingestFromSources(daysBack: number = 7): Promise<IngestResult> {
  const sources = await prisma.source.findMany({
    where: { enabled: true }
  })

  let itemsFetched = 0
  let itemsNew = 0
  const errors: string[] = []
  const cutoffDate = subDays(new Date(), daysBack)

  for (const source of sources) {
    try {
      if (source.type === 'rss' && source.url) {
        const result = await ingestRSS(source.url, source.name, source.id, cutoffDate)
        itemsFetched += result.fetched
        itemsNew += result.newItems
      }
    } catch (error) {
      const errorMsg = `Error ingesting ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      errors.push(errorMsg)
    }
  }

  return { itemsFetched, itemsNew, errors }
}

async function ingestRSS(
  url: string,
  sourceName: string,
  sourceId: string,
  cutoffDate: Date
): Promise<{ fetched: number; newItems: number }> {
  const feed = await parser.parseURL(url)
  let fetched = 0
  let newItems = 0

  for (const item of feed.items) {
    if (!item.link || !item.title) continue

    const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date()
    
    if (publishedAt < cutoffDate) continue

    fetched++

    try {
      await prisma.article.create({
        data: {
          title: item.title,
          url: item.link,
          source: sourceName,
          sourceId: sourceId,
          publishedAt,
          rawContent: item.contentSnippet || item.content || null,
        }
      })
      newItems++
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        continue
      }
      throw error
    }
  }

  return { fetched, newItems }
}

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function deduplicateArticles(): Promise<number> {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'asc' }
  })

  const seen = new Map<string, string>()
  let duplicatesRemoved = 0

  for (const article of articles) {
    const normalizedTitle = normalizeTitle(article.title)
    const key = `${normalizedTitle}|${article.url}`

    if (seen.has(normalizedTitle)) {
      const existingId = seen.get(normalizedTitle)!
      if (existingId !== article.id) {
        await prisma.article.delete({ where: { id: article.id } })
        duplicatesRemoved++
        continue
      }
    }

    seen.set(normalizedTitle, article.id)
  }

  return duplicatesRemoved
}
