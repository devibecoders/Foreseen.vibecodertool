/**
 * Ignore Reasons API Route
 * 
 * POST /api/decisions/ignore-reason - Save an ignore reason with weight adjustments
 * GET  /api/decisions/ignore-reason - Get ignore reason statistics
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { 
  IGNORE_REASONS, 
  calculateIgnoreWeightAdjustments,
  type IgnoreReasonType 
} from '@/lib/signals/ignoreReasons'
import { parseSignalsJson } from '@/lib/signals/extractSignals'
import { normalizeFeatureKey } from '@/lib/signals/featureKey'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const body = await request.json()
    
    const {
      decision_id,
      article_id,
      reason_type,
      reason_text,
    } = body

    if (!article_id || !reason_type) {
      return NextResponse.json(
        { error: 'article_id and reason_type are required' },
        { status: 400 }
      )
    }

    // Validate reason type
    if (!IGNORE_REASONS[reason_type as IgnoreReasonType]) {
      return NextResponse.json(
        { error: 'Invalid reason_type' },
        { status: 400 }
      )
    }

    const user_id = 'default-user'

    // 1. Fetch article with analysis to get signals
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        id, title,
        analyses(id, signals, categories)
      `)
      .eq('id', article_id)
      .single()

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // 2. Parse signals from analysis
    const analysis = (article as any).analyses?.[0]
    const signalsJson = analysis?.signals || null
    const signals = parseSignalsJson(signalsJson)

    // If no extracted signals, try to build from categories
    if (signals.allKeys.length === 0 && analysis?.categories) {
      const cats = analysis.categories.split(',').map((c: string) => c.trim())
      for (const cat of cats) {
        const norm = normalizeFeatureKey('category', cat)
        signals.categories.push(norm.key)
        signals.allKeys.push(norm.key)
      }
    }

    // 3. Calculate weight adjustments
    const adjustments = calculateIgnoreWeightAdjustments(
      reason_type as IgnoreReasonType,
      signals,
      reason_text
    )

    // 4. Apply weight adjustments
    for (const adj of adjustments) {
      const [type, ...valueParts] = adj.feature_key.split(':')
      const value = valueParts.join(':')
      
      const { error: weightError } = await supabase.rpc('upsert_signal_weight', {
        p_user_id: user_id,
        p_feature_key: adj.feature_key,
        p_feature_type: type,
        p_feature_value: value,
        p_weight_delta: adj.delta
      })

      if (weightError) {
        console.error(`Failed to update weight for ${adj.feature_key}:`, weightError)
      }
    }

    // 5. Record the ignore reason
    const { data: ignoreReason, error: insertError } = await supabase
      .from('ignore_reasons')
      .insert({
        user_id,
        decision_id: decision_id || null,
        article_id,
        reason_type,
        reason_text: reason_text || null,
        signals_at_time: signalsJson,
        weight_adjustments: adjustments,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert ignore reason:', insertError)
      // Continue anyway - weight updates are more important
    }

    return NextResponse.json({
      success: true,
      reason: ignoreReason,
      adjustments,
      reason_config: IGNORE_REASONS[reason_type as IgnoreReasonType],
    })
  } catch (error) {
    console.error('Ignore reason error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save ignore reason' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    
    // Get statistics
    const { data: stats, error: statsError } = await supabase
      .from('ignore_reason_stats')
      .select('*')

    // Get recent ignore reasons
    const { data: recent, error: recentError } = await supabase
      .from('ignore_reasons')
      .select(`
        *,
        article:articles(id, title, source)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get available reason types
    const reasonTypes = Object.values(IGNORE_REASONS).map(r => ({
      value: r.type,
      label: r.label,
      emoji: r.emoji,
      description: r.description,
    }))

    return NextResponse.json({
      stats: stats || [],
      recent: recent || [],
      reasonTypes,
    })
  } catch (error) {
    console.error('Ignore reason stats error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
