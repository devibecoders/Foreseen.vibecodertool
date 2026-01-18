/**
 * Projects Upload API
 * 
 * Handles PDF file uploads to Supabase Storage for projects.
 * Files are stored in the 'project-documents' bucket with unique names.
 * 
 * @route POST /api/projects/upload - Upload a PDF file
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUCKET_NAME = 'project-documents'

/**
 * POST /api/projects/upload
 * Upload a PDF file to Supabase Storage
 */
export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const projectId = formData.get('projectId') as string
        const fileType = formData.get('fileType') as string // 'briefing' or 'step_plan'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!fileType || !['briefing', 'step_plan'].includes(fileType)) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
        }

        // Validate file size (max 10MB)
        const MAX_SIZE = 10 * 1024 * 1024
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = projectId
            ? `${projectId}/${fileType}_${timestamp}_${sanitizedName}`
            : `temp/${fileType}_${timestamp}_${sanitizedName}`

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: 'application/pdf',
                upsert: true
            })

        if (error) {
            console.error('Storage upload error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Get the public URL (or signed URL for private buckets)
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path)

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: data.path,
            filename: file.name
        })
    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
