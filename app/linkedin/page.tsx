'use client'

import { useState } from 'react'
import Navigation from '@/components/Navigation'
import { 
  Linkedin, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw,
  TrendingUp,
  MessageCircle,
  Lightbulb,
  HelpCircle,
  BookOpen,
  Loader2,
  BarChart3
} from 'lucide-react'
import { formatPostForCopy, estimateEngagement, type LinkedInPost } from '@/lib/linkedinGenerator'

export default function LinkedInGeneratorPage() {
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [trends, setTrends] = useState<Array<{ topic: string; articleCount: number; avgImpact: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/linkedin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 7 })
      })

      const data = await response.json()

      if (data.success) {
        setPosts(data.posts)
        setTrends(data.trends)
        setGeneratedAt(data.generatedAt)
      } else {
        setError(data.error || 'Failed to generate posts')
      }
    } catch (err) {
      setError('Network error - please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 
                              flex items-center justify-center shadow-lg">
                <Linkedin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  LinkedIn Post Generator
                </h1>
                <p className="text-slate-600">
                  Generate 3 engaging posts from this week's top trends
                </p>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Ready to create content?
                </h3>
                <p className="text-sm text-slate-600">
                  AI analyzes your weekly trends and generates 3 unique post drafts
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white 
                           rounded-lg font-semibold hover:bg-blue-700 transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Posts
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Trends Summary */}
        {trends.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Based on these trends
            </h3>
            <div className="flex gap-3">
              {trends.map((trend, i) => (
                <div 
                  key={i}
                  className="flex-1 p-3 bg-white border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">{trend.topic}</span>
                    <span className="text-xs text-slate-500">{trend.articleCount} articles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3 h-3 text-slate-400" />
                    <span className="text-xs text-slate-600">
                      Avg impact: {trend.avgImpact}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Posts */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Your Post Drafts
              </h2>
              {generatedAt && (
                <span className="text-xs text-slate-500">
                  Generated {new Date(generatedAt).toLocaleString()}
                </span>
              )}
            </div>

            {posts.map((post, index) => (
              <LinkedInPostCard key={post.id} post={post} index={index} />
            ))}

            {/* Regenerate button */}
            <div className="text-center pt-4">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 
                           hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Generate new posts
              </button>
            </div>
          </div>
        ) : !loading && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
            <Linkedin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              No posts generated yet
            </h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Click "Generate Posts" to create 3 LinkedIn post drafts based on your 
              weekly AI news trends.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                1 Insight Post
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500" />
                1 Question Post
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-500" />
                1 Story Post
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function LinkedInPostCard({ post, index }: { post: LinkedInPost; index: number }) {
  const [copied, setCopied] = useState(false)
  const engagement = estimateEngagement(post)

  const handleCopy = async () => {
    const text = formatPostForCopy(post)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const typeIcon = {
    insight: <Lightbulb className="w-4 h-4" />,
    question: <HelpCircle className="w-4 h-4" />,
    story: <BookOpen className="w-4 h-4" />
  }

  const typeColor = {
    insight: 'bg-amber-50 text-amber-700 border-amber-200',
    question: 'bg-blue-50 text-blue-700 border-blue-200',
    story: 'bg-green-50 text-green-700 border-green-200'
  }

  const typeLabel = {
    insight: 'Insight',
    question: 'Question',
    story: 'Story'
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 bg-slate-900 text-white rounded-full 
                          flex items-center justify-center text-sm font-bold">
            {index + 1}
          </span>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                           text-xs font-medium border ${typeColor[post.postType]}`}>
            {typeIcon[post.postType]}
            {typeLabel[post.postType]}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Engagement score */}
          <div className="flex items-center gap-2" title={engagement.reasons.join(', ')}>
            <MessageCircle className="w-4 h-4 text-slate-400" />
            <span className={`text-sm font-medium ${
              engagement.score >= 70 ? 'text-green-600' :
              engagement.score >= 50 ? 'text-amber-600' :
              'text-slate-600'
            }`}>
              {engagement.score}/100
            </span>
          </div>

          {/* Character count */}
          <span className="text-xs text-slate-500">
            {post.characterCount} chars
          </span>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 
                       hover:bg-slate-200 rounded-lg text-sm font-medium 
                       text-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-5">
        {/* Hook */}
        <p className="text-lg font-semibold text-slate-900 mb-4 leading-relaxed">
          {post.hook}
        </p>

        {/* Body */}
        <div className="text-slate-700 mb-4 whitespace-pre-wrap leading-relaxed">
          {post.body}
        </div>

        {/* CTA */}
        <p className="text-slate-600 mb-4 italic">
          {post.callToAction}
        </p>

        {/* Hashtags */}
        <div className="flex flex-wrap gap-2">
          {post.hashtags.map((tag, i) => (
            <span 
              key={i}
              className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium"
            >
              #{tag.replace(/^#/, '')}
            </span>
          ))}
        </div>
      </div>

      {/* Based on */}
      {post.basedOn.length > 0 && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            <strong>Based on:</strong> {post.basedOn.slice(0, 2).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
