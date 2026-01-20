/**
 * Preferences Reset API Route
 * POST /api/preferences/reset - Reset a topic to neutral (weight 0, unmuted)
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const { key_type, key_value } = await request.json()
        const userId = 'default-user'

        if (!key_type || !key_value) {
            return NextResponse.json(
                { ok: false, error: 'key_type and key_value are required' },
                { status: 400 }
            )
        }

        const { normalizeFeatureKey } = await import('@/lib/signals/featureKey')
        const norm = normalizeFeatureKey(key_type, key_value)

        // Reset signal weight to neutral
        const { error } = await supabase
            .from('user_signal_weights')
            .upsert({
                user_id: userId,
                feature_key: norm.key,
                feature_type: norm.type,
                feature_value: norm.value,
                weight: 0,
                state: 'active',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,feature_key'
            })

        if (error) throw error

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Preference reset error:', error)
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to reset preference' },
            { status: 500 }
        )
    }
}
