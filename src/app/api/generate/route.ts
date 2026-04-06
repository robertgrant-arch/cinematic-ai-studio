import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateVideo, VideoModel } from '@/lib/fal/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      projectId,
      shotId,
      prompt,
      model = 'kling' as VideoModel,
      duration = 5,
      aspectRatio = '16:9',
      imageUrl,
    } = body

    if (!projectId || !prompt) {
      return NextResponse.json(
        { error: 'projectId and prompt are required' },
        { status: 400 }
      )
    }

    // Create a job record
    const { data: job, error: jobError } = await supabase
      .from('generation_jobs')
      .insert({
        project_id: projectId,
        shot_id: shotId || null,
        model,
        prompt,
        status: 'queued',
        user_id: user.id,
      })
      .select()
      .single()

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 })
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
        result_url: videoUrl,
        completed_at: new Date().toISOString(),
        metadata: result.data,
      })
      .eq('id', job.id)

    // If this is tied to a shot, update the shot's video_url
    if (shotId && videoUrl) {
      await supabase
        .from('shots')
        .update({ video_url: videoUrl, status: 'completed' })
        .eq('id', shotId)
    }

    return NextResponse.json({
      jobId: job.id,
      status: 'completed',
      videoUrl,
    })
  } catch (error: any) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
