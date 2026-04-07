import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fal } from '@/lib/fal/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Get all approved shots in order
    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('*')
      .eq('project_id', projectId)
      .eq('approval_status', 'approved')
      .order('scene_index', { ascending: true })

    if (shotsError) {
      return NextResponse.json({ error: shotsError.message }, { status: 500 })
    }

    if (!shots || shots.length === 0) {
      return NextResponse.json({ error: 'No approved shots found' }, { status: 400 })
    }

    // Collect video URLs in order
    const videoUrls = shots
      .filter((s: any) => s.output_url)
      .map((s: any) => s.output_url)

    if (videoUrls.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 approved shots with videos to stitch' },
        { status: 400 }
      )
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
      return NextResponse.json({ error: exportError.message }, { status: 500 })
    }

    // Call fal.ai ffmpeg merge-videos API
    const result = await fal.subscribe('fal-ai/ffmpeg-api/merge-videos', {
      input: {
        video_urls: videoUrls,
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS' && update.logs) {
          update.logs.map((log) => log.message).forEach(console.log)
        }
      },
    })

    const mergedVideoUrl = result.data?.video?.url || result.data?.output?.url

    if (!mergedVideoUrl) {
      await supabase
        .from('exports')
        .update({ status: 'failed' })
        .eq('id', exportRecord.id)

      return NextResponse.json({ error: 'Stitching failed - no output URL' }, { status: 500 })
    }

    // Update export with final video
    await supabase
      .from('exports')
      .update({
        output_url: mergedVideoUrl,
        status: 'completed',
      })
      .eq('id', exportRecord.id)

    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'exported' })
      .eq('id', projectId)

    return NextResponse.json({
      exportId: exportRecord.id,
      status: 'completed',
      videoUrl: mergedVideoUrl,
      shotCount: videoUrls.length,
    })
  } catch (error: any) {
    console.error('Stitch error:', error)
    return NextResponse.json(
      { error: error.message || 'Stitching failed' },
      { status: 500 }
    )
  }
}
