import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, videoUrls: clientVideoUrls } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Use video URLs passed from client (approved shots) or fetch from DB
    let videoUrls = clientVideoUrls

    if (!videoUrls || videoUrls.length === 0) {
      // Get all approved shots in order
      const { data: shots, error: shotsError } = await supabase
        .from('shots')
        .select('*')
        .eq('project_id', projectId)
        .eq('approval_status', 'approved')
        .order('order_index', { ascending: true })

      if (shotsError) {
        return NextResponse.json({ error: shotsError.message }, { status: 500 })
      }

      if (!shots || shots.length === 0) {
        return NextResponse.json({ error: 'No approved shots found' }, { status: 400 })
      }

      videoUrls = shots
        .filter((s: any) => s.video_url || s.output_url)
        .map((s: any) => s.video_url || s.output_url)
    }

    if (!videoUrls || videoUrls.length < 2) {
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
      // Continue even if export record creation fails
      console.error('Export record error:', exportError.message)
    }

    // Call fal.ai ffmpeg merge-videos API
    const FAL_KEY = process.env.FAL_KEY
    if (!FAL_KEY) {
      return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 500 })
    }

    const falResponse = await fetch('https://fal.run/fal-ai/ffmpeg-api/merge-videos', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_urls: videoUrls,
      }),
    })

    if (!falResponse.ok) {
      const errText = await falResponse.text()
      return NextResponse.json({ error: `Fal.ai error: ${errText}` }, { status: 500 })
    }

    const falData = await falResponse.json() as any
    const mergedVideoUrl = falData?.video?.url || falData?.output_url || falData?.url

    if (!mergedVideoUrl) {
      if (exportRecord) {
        await supabase
          .from('exports')
          .update({ status: 'failed' })
          .eq('id', exportRecord.id)
      }
      return NextResponse.json({ error: 'Stitching failed - no output URL' }, { status: 500 })
    }

    // Update export with final video
    if (exportRecord) {
      await supabase
        .from('exports')
        .update({
          output_url: mergedVideoUrl,
          status: 'completed',
        })
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
    console.error('Stitch error:', error)
    return NextResponse.json(
      { error: error.message || 'Stitching failed' },
      { status: 500 }
    )
  }
}
