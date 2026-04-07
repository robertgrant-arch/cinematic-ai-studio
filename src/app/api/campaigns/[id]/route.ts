import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: shots, error: shotsError } = await supabase
      .from('shots')
      .select('*')
      .eq('project_id', params.id)
      .order('order_index', { ascending: true })

    return NextResponse.json({ project, shots: shots || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shots } = body

    if (shots && Array.isArray(shots)) {
      for (const shot of shots) {
        if (shot.id) {
          await supabase
            .from('shots')
            .update({
              shot_type: shot.shot_type,
              prompt: shot.prompt,
              duration: shot.duration,
              camera_movement: shot.camera_movement,
              video_url: shot.video_url,
              status: shot.status,
              approval_status: shot.approval_status,
            })
            .eq('id', shot.id)
        } else {
          await supabase
            .from('shots')
            .insert({
              project_id: params.id,
              order_index: shot.order_index,
              shot_type: shot.shot_type,
              prompt: shot.prompt || '',
              duration: shot.duration || 5,
              camera_movement: shot.camera_movement || 'Static Lock',
              status: shot.status || 'draft',
              approval_status: shot.approval_status || 'pending',
            })
        }
      }
    }

    const { data: updatedShots } = await supabase
      .from('shots')
      .select('*')
      .eq('project_id', params.id)
      .order('order_index', { ascending: true })

    return NextResponse.json({ shots: updatedShots || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
