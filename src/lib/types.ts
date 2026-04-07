// Cinematic AI Studio - Shared TypeScript Types
// All types aligned with supabase/schema.sql

export interface Project {
  id: string
  user_id: string
  name: string
  brief: string | null
  product_name: string | null
  product_description: string | null
  target_audience: string | null
  tone: string
  duration_seconds: number
  platforms: string[]
  status: ProjectStatus
  brand_kit: Record<string, any>
  created_at: string
  updated_at: string
  // Computed (from API joins)
  shots?: { count: number }[]
  generation_jobs?: { count: number }[]
}

export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'exported' | 'archived'

export interface Shot {
  id?: string
  project_id?: string
  storyboard_id?: string | null
  order_index: number
  shot_type: ShotType
  prompt: string
  negative_prompt?: string | null
  duration: number
  camera_movement: CameraMovement
  video_url?: string | null
  thumbnail_url?: string | null
  reference_image_url?: string | null
  model?: string
  model_params?: Record<string, any>
  status: ShotStatus
  approval_status: ApprovalStatus
  fal_request_id?: string | null
  created_at?: string
  completed_at?: string | null
}

export type ShotType =
  | 'Hero Product Reveal'
  | 'Close-up Detail'
  | 'Lifestyle Context'
  | 'Dynamic Motion'
  | 'Brand Logo Outro'
  | 'Unboxing Sequence'
  | 'Before/After'
  | 'Testimonial Setup'

export type CameraMovement =
  | 'Slow Push In'
  | 'Orbit 360'
  | 'Crane Up'
  | 'Dolly Track'
  | 'Static Lock'
  | 'Rack Focus'
  | 'Whip Pan'
  | 'Steadicam Walk'

export type ShotStatus = 'draft' | 'generating' | 'completed' | 'failed'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface GenerationJob {
  id: string
  shot_id: string | null
  project_id: string
  provider: string
  model: string
  input_params: {
    prompt: string
    duration?: number
    aspect_ratio?: string
    image_url?: string
  }
  status: 'queued' | 'processing' | 'completed' | 'failed'
  result: Record<string, any> | null
  error: string | null
  cost_cents: number
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Export {
  id: string
  project_id: string
  format: string
  resolution: string
  include_captions: boolean
  include_music: boolean
  output_url: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
}

export interface ResearchPack {
  id: string
  project_id: string
  competitor_analysis: Record<string, any>
  market_insights: Record<string, any>
  hook_suggestions: string[]
  style_references: string[]
  created_at: string
}

export interface Storyboard {
  id: string
  project_id: string
  version: number
  script: string | null
  scenes: any[]
  created_at: string
}

// API Response types
export interface ApiResponse<T = any> {
  ok: boolean
  data: T | null
  error: { code: string; message: string } | null
}

export interface CampaignFormData {
  name: string
  description: string
  productName: string
  productDescription: string
  targetAudience: string
  style: string
  model: string
}

// Style and model config
export const STYLES = [
  { id: 'cinematic', label: 'Cinematic', desc: 'Film-quality dramatic lighting and composition' },
  { id: 'luxury', label: 'Luxury', desc: 'High-end premium aesthetic with elegant movement' },
  { id: 'dynamic', label: 'Dynamic', desc: 'Fast-paced energetic cuts and motion' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, simple, modern aesthetic' },
  { id: 'editorial', label: 'Editorial', desc: 'Magazine-style storytelling approach' },
] as const

export const MODELS = [
  { id: 'kling', label: 'Kling 1.6', desc: 'Best for cinematic product shots' },
  { id: 'veo', label: 'Google Veo 2', desc: 'Excellent photorealism and physics' },
  { id: 'wan', label: 'Wan 2.1', desc: 'Great for artistic and stylized content' },
  { id: 'hailuo', label: 'Hailuo Minimax', desc: 'Fast generation with good quality' },
] as const

export const SHOT_TYPES: ShotType[] = [
  'Hero Product Reveal',
  'Close-up Detail',
  'Lifestyle Context',
  'Dynamic Motion',
  'Brand Logo Outro',
  'Unboxing Sequence',
  'Before/After',
  'Testimonial Setup',
]

export const CAMERA_MOVES: CameraMovement[] = [
  'Slow Push In',
  'Orbit 360',
  'Crane Up',
  'Dolly Track',
  'Static Lock',
  'Rack Focus',
  'Whip Pan',
  'Steadicam Walk',
]

export const DEFAULT_SHOTS: Shot[] = [
  { order_index: 0, shot_type: 'Hero Product Reveal', prompt: '', duration: 5, camera_movement: 'Slow Push In', status: 'draft', approval_status: 'pending' },
  { order_index: 1, shot_type: 'Close-up Detail', prompt: '', duration: 5, camera_movement: 'Orbit 360', status: 'draft', approval_status: 'pending' },
  { order_index: 2, shot_type: 'Lifestyle Context', prompt: '', duration: 5, camera_movement: 'Steadicam Walk', status: 'draft', approval_status: 'pending' },
  { order_index: 3, shot_type: 'Dynamic Motion', prompt: '', duration: 5, camera_movement: 'Dolly Track', status: 'draft', approval_status: 'pending' },
  { order_index: 4, shot_type: 'Close-up Detail', prompt: '', duration: 5, camera_movement: 'Rack Focus', status: 'draft', approval_status: 'pending' },
  { order_index: 5, shot_type: 'Brand Logo Outro', prompt: '', duration: 5, camera_movement: 'Crane Up', status: 'draft', approval_status: 'pending' },
]
