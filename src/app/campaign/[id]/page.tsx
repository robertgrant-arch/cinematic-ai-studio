'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Shot {
  id?: string
  order_index: number
  shot_type: string
  prompt: string
  duration: number
  camera_movement: string
  video_url?: string
  status: string
}

const SHOT_TYPES = [
  'Hero Product Reveal',
  'Close-up Detail',
  'Lifestyle Context',
  'Dynamic Motion',
  'Brand Logo Outro',
  'Unboxing Sequence',
  'Before/After',
  'Testimonial Setup',
]

const CAMERA_MOVES = [
  'Slow Push In',
  'Orbit 360',
  'Crane Up',
  'Dolly Track',
  'Static Lock',
  'Rack Focus',
  'Whip Pan',
  'Steadicam Walk',
]

export default function CampaignEditorPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [shots, setShots] = useState<Shot[]>([])
  const [generating, setGenerating] = useState<Record<number, boolean>>({})
  const [activeShot, setActiveShot] = useState<number>(0)

  useEffect(() => {
    // Initialize with a default shot list for a 30-sec commercial
    if (shots.length === 0) {
      setShots([
        { order_index: 0, shot_type: 'Hero Product Reveal', prompt: '', duration: 5, camera_movement: 'Slow Push In', status: 'draft' },
        { order_index: 1, shot_type: 'Close-up Detail', prompt: '', duration: 5, camera_movement: 'Orbit 360', status: 'draft' },
        { order_index: 2, shot_type: 'Lifestyle Context', prompt: '', duration: 5, camera_movement: 'Steadicam Walk', status: 'draft' },
        { order_index: 3, shot_type: 'Dynamic Motion', prompt: '', duration: 5, camera_movement: 'Dolly Track', status: 'draft' },
        { order_index: 4, shot_type: 'Close-up Detail', prompt: '', duration: 5, camera_movement: 'Rack Focus', status: 'draft' },
        { order_index: 5, shot_type: 'Brand Logo Outro', prompt: '', duration: 5, camera_movement: 'Crane Up', status: 'draft' },
      ])
    }
  }, [])

  const updateShot = (index: number, field: keyof Shot, value: any) => {
    setShots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const addShot = () => {
    setShots(prev => [...prev, {
      order_index: prev.length,
      shot_type: 'Hero Product Reveal',
      prompt: '',
      duration: 5,
      camera_movement: 'Static Lock',
      status: 'draft',
    }])
  }

  const removeShot = (index: number) => {
    setShots(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order_index: i })))
    if (activeShot >= shots.length - 1) setActiveShot(Math.max(0, shots.length - 2))
  }

  const generateShot = async (index: number) => {
    const shot = shots[index]
    if (!shot.prompt) return alert('Please enter a prompt for this shot')

    setGenerating(prev => ({ ...prev, [index]: true }))
    updateShot(index, 'status', 'generating')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          shotId: shot.id,
          prompt: `${shot.shot_type}: ${shot.prompt}. Camera: ${shot.camera_movement}. Cinematic commercial quality, professional lighting, 4K.`,
          model: 'kling',
          duration: shot.duration,
          aspectRatio: '16:9',
        }),
      })
      const data = await res.json()
      if (data.videoUrl) {
        updateShot(index, 'video_url', data.videoUrl)
        updateShot(index, 'status', 'completed')
      } else {
        updateShot(index, 'status', 'failed')
      }
    } catch (err) {
      console.error(err)
      updateShot(index, 'status', 'failed')
    } finally {
      setGenerating(prev => ({ ...prev, [index]: false }))
    }
  }

  const generateAll = async () => {
    for (let i = 0; i < shots.length; i++) {
      if (shots[i].prompt && shots[i].status !== 'completed') {
        await generateShot(i)
      }
    }
  }

  const totalDuration = shots.reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Bar */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">
            ←
          </button>
          <h1 className="text-xl font-bold">Campaign Editor</h1>
          <span className="text-sm text-gray-500">{shots.length} shots · {totalDuration}s total</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={generateAll}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium hover:from-purple-500 hover:to-pink-500"
          >
            Generate All Shots
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Shot List Sidebar */}
        <div className="w-80 border-r border-gray-800 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Shot List</h2>
              <button onClick={addShot} className="text-purple-400 hover:text-purple-300 text-sm">+ Add Shot</button>
            </div>
            {shots.map((shot, i) => (
              <button
                key={i}
                onClick={() => setActiveShot(i)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                  activeShot === i
                    ? 'bg-gray-800 border border-purple-500/50'
                    : 'bg-gray-900/50 border border-transparent hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Shot {i + 1}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    shot.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    shot.status === 'generating' ? 'bg-yellow-500/20 text-yellow-400' :
                    shot.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>{shot.status}</span>
                </div>
                <div className="font-medium text-sm mt-1">{shot.shot_type}</div>
                <div className="text-xs text-gray-500 mt-1 truncate">{shot.prompt || 'No prompt yet'}</div>
                <div className="text-xs text-gray-600 mt-1">{shot.duration}s · {shot.camera_movement}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto">
          {shots[activeShot] && (
            <div className="max-w-3xl mx-auto p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Shot {activeShot + 1}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => generateShot(activeShot)}
                    disabled={generating[activeShot] || !shots[activeShot].prompt}
                    className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-medium hover:bg-purple-500 disabled:opacity-50"
                  >
                    {generating[activeShot] ? 'Generating...' : 'Generate This Shot'}
                  </button>
                  {shots.length > 1 && (
                    <button onClick={() => removeShot(activeShot)} className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Video Preview */}
              <div className="aspect-video bg-gray-900 rounded-xl mb-8 flex items-center justify-center border border-gray-800 overflow-hidden">
                {shots[activeShot].video_url ? (
                  <video src={shots[activeShot].video_url} controls className="w-full h-full object-cover" />
                ) : generating[activeShot] ? (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Generating cinematic shot...</p>
                    <p className="text-xs text-gray-600 mt-1">This may take 30-120 seconds</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    <p className="text-4xl mb-2">🎬</p>
                    <p>Enter a prompt and generate</p>
                  </div>
                )}
              </div>

              {/* Shot Configuration */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Shot Type</label>
                    <select
                      value={shots[activeShot].shot_type}
                      onChange={(e) => updateShot(activeShot, 'shot_type', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white"
                    >
                      {SHOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Camera Movement</label>
                    <select
                      value={shots[activeShot].camera_movement}
                      onChange={(e) => updateShot(activeShot, 'camera_movement', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white"
                    >
                      {CAMERA_MOVES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duration (seconds)</label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={shots[activeShot].duration}
                    onChange={(e) => updateShot(activeShot, 'duration', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>3s</span>
                    <span className="text-white font-medium">{shots[activeShot].duration}s</span>
                    <span>10s</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Shot Prompt</label>
                  <textarea
                    value={shots[activeShot].prompt}
                    onChange={(e) => updateShot(activeShot, 'prompt', e.target.value)}
                    rows={4}
                    placeholder="Describe exactly what should happen in this shot. Be specific about lighting, angles, product positioning, and mood..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
