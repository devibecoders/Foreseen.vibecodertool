/**
 * Intent Labels Detection Module
 * 
 * Categorizes articles by their primary intent:
 * - release: Product launches, new features, version updates
 * - controversy: Debates, criticism, ethical concerns, lawsuits
 * - how-to: Tutorials, guides, implementation instructions
 * - benchmark: Comparisons, tests, performance evaluations
 * - opinion: Editorials, predictions, think pieces
 * - news: General news without clear intent
 * - research: Academic papers, studies, technical reports
 */

export type IntentLabel = 'release' | 'controversy' | 'how-to' | 'benchmark' | 'opinion' | 'news' | 'research'

export interface IntentResult {
  label: IntentLabel
  confidence: number
  signals: string[]
}

// Intent detection patterns with associated keywords and phrases
const INTENT_PATTERNS: Record<IntentLabel, { keywords: string[], phrases: string[], weight: number }> = {
  release: {
    keywords: [
      'launches', 'launched', 'announces', 'announced', 'releases', 'released',
      'unveils', 'unveiled', 'introduces', 'introduced', 'debuts', 'rolls out',
      'ships', 'shipping', 'available now', 'now available', 'version', 'v1', 'v2',
      'beta', 'alpha', 'general availability', 'ga release', 'update', 'upgrade'
    ],
    phrases: [
      'is now', 'just announced', 'new feature', 'new tool', 'new model',
      'coming soon', 'early access', 'public preview', 'officially launch',
      'open source', 'open-source release'
    ],
    weight: 1.2 // Boost for releases (actionable)
  },
  
  controversy: {
    keywords: [
      'controversy', 'controversial', 'backlash', 'criticism', 'criticized',
      'lawsuit', 'sued', 'suing', 'legal', 'investigation', 'investigated',
      'scandal', 'fired', 'resignation', 'resigned', 'apologizes', 'apology',
      'concerns', 'worried', 'fears', 'dangerous', 'harmful', 'bias', 'biased',
      'ethics', 'ethical', 'privacy', 'surveillance', 'deepfake', 'misinformation',
      'disinformation', 'fake', 'copyright', 'infringement', 'stolen', 'leaked'
    ],
    phrases: [
      'raises concerns', 'under fire', 'facing criticism', 'sparks debate',
      'accused of', 'slammed for', 'faces backlash', 'draws criticism',
      'ethical implications', 'privacy concerns', 'job losses', 'replace workers'
    ],
    weight: 1.1
  },
  
  'how-to': {
    keywords: [
      'tutorial', 'guide', 'how to', 'howto', 'step-by-step', 'instructions',
      'walkthrough', 'explained', 'introduction to', 'getting started',
      'beginner', 'learn', 'course', 'workshop', 'hands-on', 'practical',
      'implement', 'build', 'create', 'deploy', 'configure', 'setup', 'set up'
    ],
    phrases: [
      'how to use', 'how to build', 'how to create', 'how to implement',
      'complete guide', 'ultimate guide', 'beginners guide', "beginner's guide",
      'step by step', 'in this tutorial', 'learn how', 'get started with'
    ],
    weight: 1.15 // Tutorials are actionable
  },
  
  benchmark: {
    keywords: [
      'benchmark', 'benchmarks', 'benchmarking', 'comparison', 'compared',
      'versus', 'vs', 'test', 'tested', 'testing', 'evaluation', 'evaluated',
      'performance', 'speed', 'accuracy', 'score', 'scores', 'ranking',
      'leaderboard', 'beats', 'outperforms', 'faster', 'better', 'best'
    ],
    phrases: [
      'head to head', 'side by side', 'which is better', 'compared to',
      'performance comparison', 'benchmark results', 'test results',
      'we tested', 'i tested', 'puts to the test', 'ranks among'
    ],
    weight: 1.0
  },
  
  opinion: {
    keywords: [
      'opinion', 'editorial', 'commentary', 'analysis', 'perspective',
      'think', 'believe', 'argues', 'argument', 'prediction', 'predicts',
      'future', 'forecast', 'outlook', 'speculation', 'might', 'could',
      'should', 'must', 'need to', 'time to', 'why we', 'why you'
    ],
    phrases: [
      'i think', 'in my opinion', 'it seems', 'appears to be',
      'what this means', 'what it means for', 'why this matters',
      'the case for', 'the case against', 'hot take', 'unpopular opinion',
      'here is why', "here's why", 'the real reason'
    ],
    weight: 0.9
  },
  
  research: {
    keywords: [
      'research', 'study', 'paper', 'publication', 'journal', 'academic',
      'scientists', 'researchers', 'findings', 'discovered', 'discovery',
      'breakthrough', 'novel', 'arxiv', 'preprint', 'peer-reviewed',
      'experiment', 'experimental', 'methodology', 'hypothesis'
    ],
    phrases: [
      'new study', 'research shows', 'researchers found', 'scientists discover',
      'according to research', 'new paper', 'published in', 'peer reviewed',
      'experimental results', 'our findings'
    ],
    weight: 1.0
  },
  
  news: {
    keywords: [], // Fallback category
    phrases: [],
    weight: 0.8
  }
}

/**
 * Detect intent from article content
 * Uses keyword matching with confidence scoring
 */
export function detectIntent(input: {
  title: string
  summary?: string
  content?: string
}): IntentResult {
  // Combine text for analysis (title weighted more heavily)
  const titleLower = input.title.toLowerCase()
  const summaryLower = (input.summary || '').toLowerCase()
  const contentLower = (input.content?.substring(0, 1500) || '').toLowerCase()
  
  const results: Array<{ label: IntentLabel, score: number, signals: string[] }> = []
  
  // Check each intent type
  for (const [label, patterns] of Object.entries(INTENT_PATTERNS) as Array<[IntentLabel, typeof INTENT_PATTERNS[IntentLabel]]>) {
    if (label === 'news') continue // Skip news, it's the fallback
    
    let score = 0
    const signals: string[] = []
    
    // Check keywords
    for (const keyword of patterns.keywords) {
      // Title match = 3 points, summary = 2 points, content = 1 point
      if (titleLower.includes(keyword)) {
        score += 3
        signals.push(`title:"${keyword}"`)
      }
      if (summaryLower.includes(keyword)) {
        score += 2
        signals.push(`summary:"${keyword}"`)
      }
      if (contentLower.includes(keyword)) {
        score += 1
        // Don't add to signals for content (too noisy)
      }
    }
    
    // Check phrases (more specific = more points)
    for (const phrase of patterns.phrases) {
      if (titleLower.includes(phrase)) {
        score += 5
        signals.push(`title:"${phrase}"`)
      }
      if (summaryLower.includes(phrase)) {
        score += 3
        signals.push(`summary:"${phrase}"`)
      }
    }
    
    // Apply weight
    score *= patterns.weight
    
    if (score > 0) {
      results.push({ label, score, signals: signals.slice(0, 5) })
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score)
  
  // If no matches, return news
  if (results.length === 0) {
    return {
      label: 'news',
      confidence: 0.5,
      signals: ['no_specific_intent_detected']
    }
  }
  
  // Calculate confidence based on score gap
  const topResult = results[0]
  const runnerUp = results[1]
  
  let confidence: number
  if (!runnerUp) {
    // Only one match
    confidence = Math.min(0.95, 0.5 + (topResult.score / 20))
  } else {
    // Multiple matches - confidence based on gap
    const gap = topResult.score - runnerUp.score
    confidence = Math.min(0.95, 0.4 + (gap / topResult.score) * 0.5 + (topResult.score / 30))
  }
  
  return {
    label: topResult.label,
    confidence: Math.round(confidence * 100) / 100,
    signals: topResult.signals
  }
}

/**
 * Get intent display properties
 */
export function getIntentDisplayProps(intent: IntentLabel): {
  emoji: string
  color: string
  bgColor: string
  label: string
  description: string
} {
  const props: Record<IntentLabel, ReturnType<typeof getIntentDisplayProps>> = {
    release: {
      emoji: '🚀',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
      label: 'Release',
      description: 'New product, feature, or version'
    },
    controversy: {
      emoji: '⚡',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
      label: 'Controversy',
      description: 'Debate, criticism, or ethical concern'
    },
    'how-to': {
      emoji: '📚',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      label: 'How-To',
      description: 'Tutorial, guide, or instructions'
    },
    benchmark: {
      emoji: '📊',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
      label: 'Benchmark',
      description: 'Comparison or performance test'
    },
    opinion: {
      emoji: '💭',
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      label: 'Opinion',
      description: 'Editorial, prediction, or analysis'
    },
    news: {
      emoji: '📰',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      label: 'News',
      description: 'General news update'
    },
    research: {
      emoji: '🔬',
      color: 'text-cyan-700',
      bgColor: 'bg-cyan-50',
      label: 'Research',
      description: 'Academic study or paper'
    }
  }
  
  return props[intent] || props.news
}

/**
 * Batch process articles to add intent labels
 */
export function detectIntentBatch(articles: Array<{
  id: string
  title: string
  summary?: string
  content?: string
}>): Array<{ id: string } & IntentResult> {
  return articles.map(article => ({
    id: article.id,
    ...detectIntent(article)
  }))
}
