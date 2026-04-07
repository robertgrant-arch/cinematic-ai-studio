import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Shot } from '@/lib/types'

// Helper: consistent API response
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

// GET /api/campaigns/[id] - Get project + shots
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await authenticate()
    if (!user) return fail('UNAUTHORIZED', 'Authentication required', 401)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return fail('NOT_FOUND', 'Project not found', 404)
    }

    const { data: shots } = await supabase
      .from('shots')
      .select('*')
      .eq('project_id', params.id)
      .order('order_index', { ascending: true })

    return ok({ project, shots: shots || [] })
  } catch (error: any) {
    console.error(`[GET /api/campaigns/${params.id}]`, error.message)
    return fail('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}

// PUT /api/campaigns/[id] - Update project and/or shots
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await authenticate()
    if (!user) return fail('UNAUTHORIZED', 'Authentication required', 401)

    // Verify ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!project) return fail('NOT_FOUND', 'Project not found', 404)

    let body: any
    try {
      body = await request.json()
    } catch {
      return fail('INVALID_JSON', 'Request body must be valid JSON', 400)
    }

    const { shots, name, brief, product_name, product_description, target_audience, tone, status } = body

    // Update project fields if provided
    if (name || brief !== undefined || product_name !== undefined || status) {
      const updateData: any = { updated_at: new Date().toISOString() }
      if (name) updateData.name = name
      if (brief !== undefined) updateData.brief = brief
      if (product_name !== undefined) updateData.product_name = product_name
      if (product_description !== undefined) updateData.product_description = product_description
      if (target_audience !== undefined) updateData.target_audience = target_audience
      if (tone !== undefined) updateData.tone = tone
      if (status) updateData.status = status

      await supabase.from('projects').update(updateData).eq('id', params.id)
    }

    // Update shots if provided
    if (shots && Array.isArray(shots)) {
      for (const shot of shots) {
        if (shot.id) {
          // Update existing shot
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
              order_index: shot.order_index,
            })
            .eq('id', shot.id)
            .eq('project_id', params.id)
        } else {
          // Insert new shot
          await supabase
            .from('shots')
            .insert({
              project_id: params.id,
              order_index: shot.order_index ?? 0,
              shot_type: shot.shot_type || 'Hero Product Reveal',
              prompt: shot.prompt || '',
              duration: shot.duration || 5,
              camera_movement: shot.camera_movement || 'Static Lock',
              status: shot.status || 'draft',
              approval_status: shot.approval_status || 'pending',
            })
        }
      }
    }

    // Return updated state
    const { data: updatedProject } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .single()

    const { data: updatedShots } = await supabase
      .from('shots')
      .select('*')
      .eq('project_id', params.id)
      .order('order_index', { ascending: true })

    return ok({ project: updatedProject, shots: updatedShots || [] })
  } catch (error: any) {
    console.error(`[PUT /api/campaigns/${params.id}]`, error.message)
    return fail('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}

// DELETE /api/campaigns/[id] - Delete project and all related data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { supabase, user } = await authenticate()
    if (!user) return fail('UNAUTHORIZED', 'Authentication required', 401)

    // Verify ownership before delete
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!project) return fail('NOT_FOUND', 'Project not found', 404)

    // Cascade delete handles shots, jobs, exports via FK constraints
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error(`[DELETE /api/campaigns/${params.id}]`, error.message)
      return fail('DB_ERROR', error.message, 500)
    }

    return ok({ deleted: true })
  } catch (error: any) {
    console.error(`[DELETE /api/campaigns/${params.id}]`, error.message)
    return fail('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}
