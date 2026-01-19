/**
 * Single Scan API Route
 * 
 * DELETE /api/scans/[id] - Delete a scan
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseAdmin()
    const { error } = await supabase
      .from('scans')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete scan' },
      { status: 500 }
    )
  }
}
