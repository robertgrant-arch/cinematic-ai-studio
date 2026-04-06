import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_KEY })

export type VideoModel = 'veo3' | 'kling3' | 'sora2' | 'wan2' | 'hailuo' | 'ltx'

export const MODEL_MAP: Record<VideoModel, { id: string; label: string; tier: string; bestFor: string }> = {
  veo3: { id: 'fal-ai/veo3', label: 'Veo 3.1', tier: 'premium', bestFor: 'Cinematic hero shots, product beauty shots' },
  kling3: { id: 'fal-ai/kling-video/v2.1/master', label: 'Kling 3 Pro', tier: 'standard', bestFor: 'Fluid motion, lifestyle scenes' },
  sora2: { id: 'fal-ai/sora/v2', label: 'Sora 2 Pro', tier: 'premium', bestFor: 'Narrative sequences, complex scenes' },
  wan2: { id: 'fal-ai/wan/v2.2/1080p', label: 'Wan 2.2', tier: 'budget', bestFor: 'Quick drafts, ideation, batch generation' },
  hailuo: { id: 'fal-ai/hailuo/video-01-live', label: 'Hailuo 2.3', tier: 'standard', bestFor: 'Fast turnaround, social content' },
  ltx: { id: 'fal-ai/ltx-video/v0.9.7', label: 'LTX Video', tier: 'budget', bestFor: 'Rapid prototyping, animatics' },
}

export function selectModel(shotType: string): VideoModel {
  const mapping: Record<string, VideoModel> = {
    hero: 'veo3',
    product_closeup: 'veo3',
    lifestyle: 'kling3',
    narrative: 'sora2',
    transition: 'wan2',
    b_roll: 'hailuo',
    draft: 'ltx',
  }
  return mapping[shotType] || 'kling3'
}

export async function generateVideo(params: {
  model: VideoModel
  prompt: string
  duration?: number
  aspectRatio?: string
  imageUrl?: string
}) {
  const modelConfig = MODEL_MAP[params.model]
  const input: any = {
    prompt: params.prompt,
    duration: params.duration || 5,
    aspect_ratio: params.aspectRatio || '16:9',
  }
  if (params.imageUrl) input.image_url = params.imageUrl

  const result = await fal.subscribe(modelConfig.id, {
    input,
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS' && update.logs) {
        update.logs.map((log) => log.message).forEach(console.log)
      }
    },
  })

  return result
}

export { fal }
