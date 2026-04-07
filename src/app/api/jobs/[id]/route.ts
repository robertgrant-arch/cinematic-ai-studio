import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data, error: null }, { status })
}
function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, data: null, error: { code, message } }, { status })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return fail('UNAUTHORIZED', 'Authentication required', 401)
    }

    // Join through project to verify ownership
    const { data: job, error } = await supabase
      .from('generation_jobs')
      .select('*, projects!inner(user_id)')
      .eq('id', id)
      .single()

    if (error || !job) {
      return fail('NOT_FOUND', 'Job not found', 404)
    }

    // Verify the job belongs to a project owned by the user
    if ((job as any).projects?.user_id !== user.id) {
      return fail('NOT_FOUND', 'Job not found', 404)
    }

    // Remove the joined project data before returning
    const { projects, ...jobData } = job as any

    return ok({ job: jobData })
  } catch (error: any) {
    console.error(`[GET /api/jobs/${id}] Unexpected:`, error.message)
    return fail('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}
