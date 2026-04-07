import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVideo, VideoModel } from '@/lib/fal/client'

// Consistent API response helpers
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

    const {
      projectId,
      shotId,
      prompt,
      model = 'kling3' as VideoModel,
      duration = 5,
      aspectRatio = '16:9',
      imageUrl,
    } = body

    if (!projectId || !prompt) {
      return fail('VALIDATION_ERROR', 'projectId and prompt are required', 400)
    }

    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return fail('VALIDATION_ERROR', 'Prompt must be a non-empty string', 400)
    }

    if (duration < 1 || duration > 30) {
      return fail('VALIDATION_ERROR', 'Duration must be between 1 and 30 seconds', 400)
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return fail('NOT_FOUND', 'Project not found', 404)

    // Create a job record
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        project_id: projectId,
        shot_id: shotId || null,
        model,
        input_params: { prompt, duration, aspect_ratio: aspectRatio, image_url: imageUrl },
        status: 'queued',
        provider: 'fal',
      })
      .select()
      .single()

    if (jobError) {
      console.error('[POST /api/generate] Job insert error:', jobError)
      return fail('DB_ERROR', jobError.message, 500)
    }

    // Update status to processing
    await supabase
      .from('generation_jobs')
      .update({ status: 'processing', started_at: new Date().toISOString() })
      .eq('id', job.id)

    // Call fal.ai to generate the video
    const result = await generateVideo({
      model,
      prompt,
      duration,
      aspectRatio,
      imageUrl,
    })

    const videoUrl = result.data?.video?.url || result.data?.output?.video

    // Update job with result
    await supabase
      .from('generation_jobs')
      .update({
        status: 'completed',
        result: { video_url: videoUrl, ...result.data },
        completed_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    // If tied to a shot, update the shot's video_url
    if (shotId && videoUrl) {
      await supabase
        .from('shots')
        .update({ video_url: videoUrl, status: 'completed' })
        .eq('id', shotId)
    }

    return ok({
      jobId: job.id,
      status: 'completed',
      videoUrl,
    })
  } catch (error: any) {
    console.error('[POST /api/generate] Unexpected:', error.message)
    return fail('GENERATION_ERROR', error.message || 'Generation failed', 500)
  }
}
