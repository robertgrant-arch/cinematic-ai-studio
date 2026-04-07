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
  // New enterprise fields
  spokesperson: SpokespersonConfig | null
  voiceover: VoiceoverConfig | null
  music: MusicConfig | null
  transition_style: TransitionStyle
  color_grade: ColorGrade
  aspect_ratio: AspectRatio
  created_at: string
  updated_at: string
  // Computed (from API joins)
  shots?: { count: number }[]
  generation_jobs?: { count: number }[]
}

export type ProjectStatus = 'draft' | 'in_progress' | 'review' | 'exported' | 'archived'

export interface SpokespersonConfig {
  type: SpokespersonType
  name: string | null
  description: string | null
  age_range: string | null
  gender: string | null
  ethnicity: string | null
  attire: string | null
  reference_image_url: string | null
}

export type SpokespersonType = 'none' | 'on_camera_talent' | 'voice_only' | 'animated_avatar' | 'ai_presenter'

export interface VoiceoverConfig {
  enabled: boolean
  provider: 'elevenlabs' | 'google' | 'amazon' | 'none'
  voice_id: string | null
  script: string | null
  tone: VoiceoverTone
  speed: number
}

export type VoiceoverTone = 'warm' | 'authoritative' | 'friendly' | 'urgent' | 'calm' | 'professional'

export interface MusicConfig {
  enabled: boolean
  style: MusicStyle
  tempo: MusicTempo
  custom_url: string | null
  volume: number
}

export type MusicStyle = 'cinematic_orchestral' | 'corporate_uplifting' | 'emotional_piano' | 'modern_ambient' | 'energetic_pop' | 'dramatic_tension' | 'none'
export type MusicTempo = 'slow' | 'medium' | 'fast'
export type TransitionStyle = 'cut' | 'crossfade' | 'fade_to_black' | 'dissolve' | 'wipe' | 'zoom'
export type ColorGrade = 'natural' | 'cinematic_warm' | 'cinematic_cool' | 'high_contrast' | 'desaturated' | 'vintage'
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5'

export interface Shot {
  id?: string
  project_id?: string
  storyboard_id?: string | null
  order_index: number
  shot_type: ShotType
  prompt: string
  enhanced_prompt?: string | null
  negative_prompt?: string | null
  duration: number
  camera_movement: CameraMovement
  video_url?: string | null
  thumbnail_url?: string | null
  reference_image_url?: string | null
  model?: string
  model_params?: Record<string, any>
  transition_in?: TransitionStyle
  transition_out?: TransitionStyle
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
  | 'Spokesperson Intro'
  | 'Problem Statement'
  | 'Solution Reveal'
  | 'Social Proof'
  | 'Call to Action'
  | 'Emotional Hook'

export type CameraMovement =
  | 'Slow Push In'
  | 'Orbit 360'
  | 'Crane Up'
  | 'Dolly Track'
  | 'Static Lock'
  | 'Rack Focus'
  | 'Whip Pan'
  | 'Steadicam Walk'
  | 'Aerial Drone'
  | 'Dutch Angle'
  | 'Pull Back Reveal'
  | 'Handheld Intimate'

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
export interface ApiResponse<T> {
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
  spokesperson: SpokespersonConfig
  voiceover: VoiceoverConfig
  music: MusicConfig
  transitionStyle: TransitionStyle
  colorGrade: ColorGrade
  aspectRatio: AspectRatio
}

// Style and model config
export const STYLES = [
  { id: 'cinematic', label: 'Cinematic', desc: 'Film-quality dramatic lighting and composition' },
  { id: 'luxury', label: 'Luxury', desc: 'High-end premium aesthetic with elegant movement' },
  { id: 'dynamic', label: 'Dynamic', desc: 'Fast-paced energetic cuts and motion' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, simple, modern aesthetic' },
  { id: 'editorial', label: 'Editorial', desc: 'Magazine-style storytelling approach' },
  { id: 'documentary', label: 'Documentary', desc: 'Authentic, raw, real-world feel' },
  { id: 'broadcast', label: 'Broadcast TV', desc: 'Network television commercial quality' },
] as const

export const MODELS = [
  { id: 'kling', label: 'Kling 1.6', desc: 'Best for cinematic product shots' },
  { id: 'veo', label: 'Google Veo 2', desc: 'Excellent photorealism and physics' },
  { id: 'wan', label: 'Wan 2.1', desc: 'Great for artistic and stylized content' },
  { id: 'hailuo', label: 'Hailuo Minimax', desc: 'Fast generation with good quality' },
] as const

export const SPOKESPERSON_TYPES: { id: SpokespersonType; label: string; desc: string }[] = [
  { id: 'none', label: 'No Spokesperson', desc: 'Product-focused visuals only' },
  { id: 'on_camera_talent', label: 'On-Camera Talent', desc: 'AI-generated person speaking to camera' },
  { id: 'voice_only', label: 'Voice Only', desc: 'Voiceover narration with product visuals' },
  { id: 'animated_avatar', label: 'Animated Avatar', desc: 'Stylized animated character' },
  { id: 'ai_presenter', label: 'AI Presenter', desc: 'Professional AI-generated presenter' },
]

export const VOICEOVER_TONES: { id: VoiceoverTone; label: string }[] = [
  { id: 'warm', label: 'Warm & Reassuring' },
  { id: 'authoritative', label: 'Authoritative & Trusted' },
  { id: 'friendly', label: 'Friendly & Approachable' },
  { id: 'urgent', label: 'Urgent & Compelling' },
  { id: 'calm', label: 'Calm & Soothing' },
  { id: 'professional', label: 'Professional & Polished' },
]

export const MUSIC_STYLES: { id: MusicStyle; label: string }[] = [
  { id: 'cinematic_orchestral', label: 'Cinematic Orchestral' },
  { id: 'corporate_uplifting', label: 'Corporate Uplifting' },
  { id: 'emotional_piano', label: 'Emotional Piano' },
  { id: 'modern_ambient', label: 'Modern Ambient' },
  { id: 'energetic_pop', label: 'Energetic Pop' },
  { id: 'dramatic_tension', label: 'Dramatic Tension' },
  { id: 'none', label: 'No Music' },
]

export const TRANSITION_STYLES: { id: TransitionStyle; label: string }[] = [
  { id: 'cut', label: 'Hard Cut' },
  { id: 'crossfade', label: 'Crossfade' },
  { id: 'fade_to_black', label: 'Fade to Black' },
  { id: 'dissolve', label: 'Dissolve' },
  { id: 'wipe', label: 'Wipe' },
  { id: 'zoom', label: 'Zoom Transition' },
]

export const COLOR_GRADES: { id: ColorGrade; label: string }[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'cinematic_warm', label: 'Cinematic Warm' },
  { id: 'cinematic_cool', label: 'Cinematic Cool' },
  { id: 'high_contrast', label: 'High Contrast' },
  { id: 'desaturated', label: 'Desaturated' },
  { id: 'vintage', label: 'Vintage Film' },
]

export const SHOT_TYPES: ShotType[] = [
  'Hero Product Reveal',
  'Close-up Detail',
  'Lifestyle Context',
  'Dynamic Motion',
  'Brand Logo Outro',
  'Unboxing Sequence',
  'Before/After',
  'Testimonial Setup',
  'Spokesperson Intro',
  'Problem Statement',
  'Solution Reveal',
  'Social Proof',
  'Call to Action',
  'Emotional Hook',
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
  'Aerial Drone',
  'Dutch Angle',
  'Pull Back Reveal',
  'Handheld Intimate',
]

export const DEFAULT_SHOTS: Shot[] = [
  { order_index: 0, shot_type: 'Hero Product Reveal', prompt: '', duration: 5, camera_movement: 'Slow Push In', status: 'draft', approval_status: 'pending' },
  { order_index: 1, shot_type: 'Close-up Detail', prompt: '', duration: 5, camera_movement: 'Orbit 360', status: 'draft', approval_status: 'pending' },
  { order_index: 2, shot_type: 'Lifestyle Context', prompt: '', duration: 5, camera_movement: 'Steadicam Walk', status: 'draft', approval_status: 'pending' },
  { order_index: 3, shot_type: 'Dynamic Motion', prompt: '', duration: 5, camera_movement: 'Dolly Track', status: 'draft', approval_status: 'pending' },
  { order_index: 4, shot_type: 'Close-up Detail', prompt: '', duration: 5, camera_movement: 'Rack Focus', status: 'draft', approval_status: 'pending' },
  { order_index: 5, shot_type: 'Brand Logo Outro', prompt: '', duration: 5, camera_movement: 'Crane Up', status: 'draft', approval_status: 'pending' },
]
