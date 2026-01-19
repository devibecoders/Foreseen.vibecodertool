/**
 * Ingest Module - Fetches articles from RSS feeds
 * 
 * Uses Supabase for database operations.
 */
import Parser from 'rss-parser'
import { supabaseAdmin } from './supabase/server'
import { subDays } from 'date-fns'

const parser = new Parser()

export interface IngestResult {
  itemsFetched: number
  itemsNew: number
  errors: string[]
}

export async function ingestFromSources(daysBack: number = 7): Promise<IngestResult> {
  const supabase = supabaseAdmin()

  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .eq('enabled', true)

  if (error) throw new Error(`Failed to fetch sources: ${error.message}`)

  let itemsFetched = 0
  let itemsNew = 0
  const errors: string[] = []
  const cutoffDate = subDays(new Date(), daysBack)

  for (const source of sources || []) {
    try {
      if (source.type === 'rss' && source.url) {
        const result = await ingestRSS(supabase, source.url, source.name, source.id, cutoffDate)
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
  supabase: ReturnType<typeof supabaseAdmin>,
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

    const { error } = await supabase
      .from('articles')
      .insert({
        title: item.title,
        url: item.link,
        source: sourceName,
        source_id: sourceId,
        published_at: publishedAt.toISOString(),
        raw_content: item.contentSnippet || item.content || null,
      })

    if (!error) {
      newItems++
    } else if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      console.error(`Failed to insert article: ${error.message}`)
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
  const supabase = supabaseAdmin()

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, url, created_at')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch articles for deduplication: ${error.message}`)

  const seen = new Map<string, string>()
  let duplicatesRemoved = 0

  for (const article of articles || []) {
    const normalizedTitle = normalizeTitle(article.title)

    if (seen.has(normalizedTitle)) {
      const existingId = seen.get(normalizedTitle)!
      if (existingId !== article.id) {
        await supabase.from('articles').delete().eq('id', article.id)
        duplicatesRemoved++
        continue
      }
    }

    seen.set(normalizedTitle, article.id)
  }

  return duplicatesRemoved
}
