/**
 * Preferences Mute API Route
 * POST /api/preferences/mute - Toggle mute on a topic (hard suppress)
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    try {
        const supabase = supabaseAdmin()
        const { key_type, key_value, muted } = await request.json()
        const userId = 'default-user'

        if (!key_type || !key_value || muted === undefined) {
            return NextResponse.json(
                { ok: false, error: 'key_type, key_value, and muted are required' },
                { status: 400 }
            )
        }

        const { normalizeFeatureKey } = await import('@/lib/signals/featureKey')
        const norm = normalizeFeatureKey(key_type, key_value)

        // Update the preference to set state to 'muted' or 'active'
        const { error } = await supabase
            .from('user_signal_weights')
            .upsert({
                user_id: userId,
                feature_key: norm.key,
                feature_type: norm.type,
                feature_value: norm.value,
                state: muted ? 'muted' : 'active',
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,feature_key'
            })

        if (error) throw error

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Preference mute error:', error)
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : 'Failed to toggle mute' },
            { status: 500 }
        )
    }
}
