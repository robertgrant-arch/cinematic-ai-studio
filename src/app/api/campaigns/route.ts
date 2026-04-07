import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types'

// Helper: consistent API response
function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data, error: null }, { status })
}
function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ ok: false, data: null, error: { code, message } }, { status })
}

// Helper: authenticate request
async function authenticate() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

// GET /api/campaigns - List all campaigns for the user
export async function GET() {
  try {
    const { supabase, user } = await authenticate()
    if (!user) return fail('UNAUTHORIZED', 'Authentication required', 401)

    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        shots(count),
        generation_jobs(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/campaigns] DB error:', error.message)
      return fail('DB_ERROR', error.message, 500)
    }

    return ok({ projects: projects || [] })
  } catch (error: any) {
    console.error('[GET /api/campaigns] Unexpected:', error.message)
    return fail('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}

// POST /api/campaigns - Create a new campaign/project
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

    const { name, description, productName, productDescription, style, targetAudience, model } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return fail('VALIDATION_ERROR', 'Campaign name is required', 400)
    }
    if (name.trim().length > 200) {
      return fail('VALIDATION_ERROR', 'Campaign name must be under 200 characters', 400)
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: name.trim(),
        brief: description || '',
        product_name: productName || '',
        product_description: productDescription || '',
        target_audience: targetAudience || '',
        tone: style || 'cinematic',
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/campaigns] DB error:', error.message)
      return fail('DB_ERROR', error.message, 500)
    }

    return ok({ project }, 201)
  } catch (error: any) {
    console.error('[POST /api/campaigns] Unexpected:', error.message)
    return fail('INTERNAL_ERROR', 'An unexpected error occurred', 500)
  }
}
