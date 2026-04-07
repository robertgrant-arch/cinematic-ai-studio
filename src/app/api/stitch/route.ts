import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data, error: null }, { status })
}
function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, data: null, error: { code, message } }, { status })
}

async function authenticate() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await authenticate()
    if (!user) return fail('UNAUTHORIZED', 'Authentication required', 401)

    let body: any
    try {
      body = await request.json()
    } catch {
      return fail('INVALID_JSON', 'Request body must be valid JSON', 400)
    }

    const { projectId, videoUrls: clientVideoUrls } = body

    if (!projectId) {
      return fail('VALIDATION_ERROR', 'projectId is required', 400)
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return fail('NOT_FOUND', 'Project not found', 404)

    // Use video URLs passed from client or fetch from DB
    let videoUrls = clientVideoUrls

    if (!videoUrls || videoUrls.length === 0) {
      const { data: shots, error: shotsError } = await supabase
        .from('shots')
        .select('*')
        .eq('project_id', projectId)
        .eq('approval_status', 'approved')
        .order('order_index', { ascending: true })

      if (shotsError) {
        console.error('[POST /api/stitch] Shots query error:', shotsError.message)
        return fail('DB_ERROR', shotsError.message, 500)
      }

      if (!shots || shots.length === 0) {
        return fail('VALIDATION_ERROR', 'No approved shots found', 400)
      }

      videoUrls = shots
        .filter((s: any) => s.video_url || s.output_url)
        .map((s: any) => s.video_url || s.output_url)
    }

    if (!videoUrls || videoUrls.length < 2) {
      return fail('VALIDATION_ERROR', 'Need at least 2 approved shots with videos to stitch', 400)
    }

    // Create an export record
    const { data: exportRecord, error: exportError } = await supabase
      .from('exports')
      .insert({
        project_id: projectId,
        format: '16:9',
        resolution: '1080p',
        status: 'processing',
      })
      .select()
      .single()

    if (exportError) {
      console.error('[POST /api/stitch] Export record error:', exportError.message)
    }

    // Call fal.ai ffmpeg merge-videos API
    const FAL_KEY = process.env.FAL_KEY
    if (!FAL_KEY) {
      return fail('CONFIG_ERROR', 'FAL_KEY not configured', 500)
    }

    const falResponse = await fetch('https://fal.run/fal-ai/ffmpeg-api/merge-videos', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video_urls: videoUrls }),
    })

    if (!falResponse.ok) {
      const errText = await falResponse.text()
      console.error('[POST /api/stitch] Fal.ai error:', errText)
      if (exportRecord) {
        await supabase.from('exports').update({ status: 'failed' }).eq('id', exportRecord.id)
      }
      return fail('STITCH_ERROR', `Fal.ai error: ${errText}`, 500)
    }

    const falData = await falResponse.json() as any
    const mergedVideoUrl = falData?.video?.url || falData?.output_url || falData?.url

    if (!mergedVideoUrl) {
      if (exportRecord) {
        await supabase.from('exports').update({ status: 'failed' }).eq('id', exportRecord.id)
      }
      return fail('STITCH_ERROR', 'Stitching failed - no output URL', 500)
    }

    // Update export with final video
    if (exportRecord) {
      await supabase
        .from('exports')
        .update({ output_url: mergedVideoUrl, status: 'completed' })
        .eq('id', exportRecord.id)
    }

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'exported' })
      .eq('id', projectId)

    return NextResponse.json({
      exportId: exportRecord?.id,
      status: 'completed',
      videoUrl: mergedVideoUrl,
      shotCount: videoUrls.length,
    })
  } catch (error: any) {
    console.error('[POST /api/stitch] Unexpected:', error.message)
    return fail('INTERNAL_ERROR', error.message || 'Stitching failed', 500)
  }
}
