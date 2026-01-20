/**
 * Preferences Adjust API Route
 * POST /api/preferences/adjust - Adjust a topic weight by delta
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const { key_type, key_value, delta } = await request.json()
        const userId = 'default-user'

        if (!key_type || !key_value || delta === undefined) {
            return NextResponse.json(
                { ok: false, error: 'key_type, key_value, and delta are required' },
                { status: 400 }
            )
        }

        const { normalizeFeatureKey } = await import('@/lib/signals/featureKey')
        const norm = normalizeFeatureKey(key_type, key_value)

        // Use the new RPC to upsert signal weight with delta
        const { error } = await supabase.rpc('upsert_signal_weight', {
            p_user_id: userId,
            p_feature_key: norm.key,
            p_feature_type: norm.type,
            p_feature_value: norm.value,
            p_weight_delta: delta
        })

        if (error) throw error

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Preference adjust error:', error)
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to adjust preference' },
            { status: 500 }
        )
    }
}
