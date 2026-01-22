/**
 * Debug endpoint to test signal weight writing
 * GET /api/debug/test-signals - Makes a mock decision and logs results
 */
import { NextRequest, NextResponse } from 'next/server'
import { updateWeightsFromDecision } from '@/lib/signals/updateWeights'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        console.log("=== DEBUG: Testing signal weight writes ===")

        // Mock article with analysis that has categories/signals
        const mockArticle = {
            title: "Grok AI can undress people in generated images",
            analyses: [{
                summary: "New report shows xAI's Grok model allows users to remove clothes.",
                categories: "Security, Generative AI",
                signals: null // Force fresh extraction
            }]
        }

        console.log("[Debug] Mock article:", mockArticle.title)

        const updates = await updateWeightsFromDecision(
            'default-user',
            mockArticle,
            'ignore'
        )

        console.log(`[Debug] Updates returned: ${updates.length}`)

        return NextResponse.json({
            success: true,
            message: `Wrote ${updates.length} signal weights`,
            updates: updates.map(u => ({
                key: u.key,
                type: u.type,
                value: u.value,
                delta: u.effectiveDelta
            }))
        })
    } catch (error) {
        console.error('[Debug] Error:', error)
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Test failed' },
            { status: 500 }
        )
    }
}
