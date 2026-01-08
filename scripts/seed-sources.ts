import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const sources = [
  {
    name: 'OpenAI Blog',
    type: 'rss',
    url: 'https://openai.com/blog/rss.xml',
    enabled: true,
  },
  {
    name: 'Anthropic News',
    type: 'rss',
    url: 'https://www.anthropic.com/news/rss.xml',
    enabled: true,
  },
  {
    name: 'Google AI Blog',
    type: 'rss',
    url: 'https://blog.google/technology/ai/rss/',
    enabled: true,
  },
  {
    name: 'Hugging Face Blog',
    type: 'rss',
    url: 'https://huggingface.co/blog/feed.xml',
    enabled: true,
  },
  {
    name: 'GitHub Blog - AI',
    type: 'rss',
    url: 'https://github.blog/category/ai-and-ml/feed/',
    enabled: true,
  },
  {
    name: 'The Verge - AI',
    type: 'rss',
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    enabled: true,
  },
  {
    name: 'TechCrunch - AI',
    type: 'rss',
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    enabled: true,
  },
  {
    name: 'MIT Technology Review - AI',
    type: 'rss',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
    enabled: true,
  },
  {
    name: 'Ars Technica - AI',
    type: 'rss',
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
    enabled: true,
  },
  {
    name: 'VentureBeat - AI',
    type: 'rss',
    url: 'https://venturebeat.com/category/ai/feed/',
    enabled: true,
  },
  {
    name: 'AI News (Artificial Intelligence News)',
    type: 'rss',
    url: 'https://www.artificialintelligence-news.com/feed/',
    enabled: true,
  },
  {
    name: 'DeepMind Blog',
    type: 'rss',
    url: 'https://deepmind.google/blog/rss.xml',
    enabled: true,
  },
  {
    name: 'Stability AI Blog',
    type: 'rss',
    url: 'https://stability.ai/news/rss.xml',
    enabled: false,
  },
  {
    name: 'LangChain Blog',
    type: 'rss',
    url: 'https://blog.langchain.dev/rss/',
    enabled: true,
  },
  {
    name: 'Cursor Blog',
    type: 'rss',
    url: 'https://www.cursor.com/blog/rss.xml',
    enabled: true,
  },
  {
    name: 'Replit Blog',
    type: 'rss',
    url: 'https://blog.replit.com/rss.xml',
    enabled: true,
  },
  {
    name: 'Vercel Blog',
    type: 'rss',
    url: 'https://vercel.com/blog/rss.xml',
    enabled: false,
  },
  {
    name: 'Simon Willison',
    type: 'rss',
    url: 'https://simonwillison.net/atom/everything/',
    enabled: true,
  },
]

async function main() {
  console.log('Seeding sources...')
  
  for (const source of sources) {
    const existing = await prisma.source.findFirst({
      where: { name: source.name }
    })
    
    if (existing) {
      await prisma.source.update({
        where: { id: existing.id },
        data: source,
      })
      console.log(`✓ Updated: ${source.name}`)
    } else {
      await prisma.source.create({
        data: source,
      })
      console.log(`✓ Created: ${source.name}`)
    }
  }
  
  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
