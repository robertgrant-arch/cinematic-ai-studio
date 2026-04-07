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
  approval_status: 'pending' | 'approved' | 'rejected'
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
  const [activeShot, setActiveShot] = useState(0)
  const [stitching, setStitching] = useState(false)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)
  const [stitchError, setStitchError] = useState<string | null>(null)

  useEffect(() => {
    if (shots.length === 0) {
      setShots([
        { order_index: 0, shot_type: 'Hero Product Reveal', prompt: '', duration: 5, camera_movement: 'Slow Push In', status: 'draft', approval_status: 'pending' },
        { order_index: 1, shot_type: 'Close-up Detail', prompt: '', duration: 5, camera_movement: 'Orbit 360', status: 'draft', approval_status: 'pending' },
        { order_index: 2, shot_type: 'Lifestyle Context', prompt: '', duration: 5, camera_movement: 'Steadicam Walk', status: 'draft', approval_status: 'pending' },
        { order_index: 3, shot_type: 'Dynamic Motion', prompt: '', duration: 5, camera_movement: 'Dolly Track', status: 'draft', approval_status: 'pending' },
        { order_index: 4, shot_type: 'Close-up Detail', prompt: '', duration: 5, camera_movement: 'Rack Focus', status: 'draft', approval_status: 'pending' },
        { order_index: 5, shot_type: 'Brand Logo Outro', prompt: '', duration: 5, camera_movement: 'Crane Up', status: 'draft', approval_status: 'pending' },
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
      approval_status: 'pending',
    }])
  }

  const removeShot = (index: number) => {
    setShots(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order_index: i })))
    if (activeShot >= shots.length - 1) setActiveShot(Math.max(0, shots.length - 2))
  }

  const approveShot = (index: number) => {
    updateShot(index, 'approval_status', 'approved')
  }

  const rejectShot = (index: number) => {
    updateShot(index, 'approval_status', 'rejected')
    updateShot(index, 'status', 'draft')
    updateShot(index, 'video_url' as any, undefined)
  }

  const generateShot = async (index: number) => {
    const shot = shots[index]
    if (!shot.prompt) return alert('Please enter a prompt for this shot')
    setGenerating(prev => ({ ...prev, [index]: true }))
    updateShot(index, 'status', 'generating')
    updateShot(index, 'approval_status', 'pending')
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

  const stitchFinalVideo = async () => {
    const approvedShots = shots.filter(s => s.approval_status === 'approved' && s.video_url)
    if (approvedShots.length < 2) {
      alert('You need at least 2 approved shots with videos to stitch the final commercial.')
      return
    }
    setStitching(true)
    setStitchError(null)
    setFinalVideoUrl(null)
    try {
      const res = await fetch('/api/stitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, videoUrls: approvedShots.map(s => s.video_url) }),
      })
      const data = await res.json()
      if (data.videoUrl) {
        setFinalVideoUrl(data.videoUrl)
      } else {
        setStitchError(data.error || 'Stitching failed')
      }
    } catch (err: any) {
      setStitchError(err.message || 'Stitching failed')
    } finally {
      setStitching(false)
    }
  }

  const approvedCount = shots.filter(s => s.approval_status === 'approved' && s.video_url).length
  const completedCount = shots.filter(s => s.status === 'completed').length
  const totalDuration = shots.filter(s => s.approval_status === 'approved').reduce((sum, s) => sum + s.duration, 0)
  const allShotsDuration = shots.reduce((sum, s) => sum + s.duration, 0)

  const approvalColor = (status: string) => {
    if (status === 'approved') return 'bg-green-500/20 border-green-500/50 text-green-400'
    if (status === 'rejected') return 'bg-red-500/20 border-red-500/50 text-red-400'
    return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
  }

  const approvalLabel = (status: string) => {
    if (status === 'approved') return '✓ Approved'
    if (status === 'rejected') return '✗ Rejected'
    return '⏳ Pending'
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">←</button>
          <h1 className="text-lg font-semibold">Campaign Editor</h1>
          <span className="text-sm text-gray-400">{shots.length} shots · {allShotsDuration}s total</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={generateAll} className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-medium hover:bg-purple-500">
            Generate All Shots
          </button>
          <button
            onClick={stitchFinalVideo}
            disabled={approvedCount < 2 || stitching}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              approvedCount >= 2 && !stitching
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/50'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {stitching ? '⏳ Stitching...' : `🎬 Stitch Final Video (${approvedCount} approved)`}
          </button>
        </div>
      </div>

      {/* Approval Timeline Bar */}
      <div className="px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400 uppercase tracking-wider">Timeline</span>
          <span className="text-xs text-gray-500">{approvedCount}/{shots.length} approved · {totalDuration}s approved</span>
          {approvedCount === shots.length && completedCount === shots.length && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ All approved — ready to stitch!</span>
          )}
        </div>
        <div className="flex gap-1">
          {shots.map((shot, i) => (
            <button
              key={i}
              onClick={() => setActiveShot(i)}
              className={`flex-1 h-8 rounded text-xs font-medium border transition-all ${
                shot.approval_status === 'approved'
                  ? 'bg-green-500/30 border-green-500/60 text-green-300'
                  : shot.approval_status === 'rejected'
                  ? 'bg-red-500/20 border-red-500/40 text-red-400'
                  : shot.status === 'completed'
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : shot.status === 'generating'
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300 animate-pulse'
                  : 'bg-gray-800 border-gray-700 text-gray-500'
              } ${activeShot === i ? 'ring-2 ring-white/30' : ''}`}
              title={`${shot.shot_type} (${shot.approval_status})`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Final Video Panel */}
      {(finalVideoUrl || stitchError) && (
        <div className="px-6 py-4 bg-gray-900 border-b border-gray-800">
          {finalVideoUrl && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-400 font-semibold">🎉 Final 30-Second Commercial Ready!</span>
                <a href={finalVideoUrl} download className="text-xs text-blue-400 hover:text-blue-300 underline">Download MP4</a>
              </div>
              <video src={finalVideoUrl} controls className="w-full max-w-3xl rounded-lg" />
            </div>
          )}
          {stitchError && (
            <div className="text-red-400 text-sm">❌ Stitch error: {stitchError}</div>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Shot List Sidebar */}
        <div className="w-72 border-r border-gray-800 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Shot List</h2>
            <button onClick={addShot} className="text-sm text-purple-400 hover:text-purple-300">+ Add Shot</button>
          </div>
          {shots.map((shot, i) => (
            <button key={i} onClick={() => setActiveShot(i)}
              className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                activeShot === i
                  ? 'bg-gray-800 border border-purple-500/50'
                  : 'bg-gray-900/50 border border-transparent hover:bg-gray-800/50'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Shot {i + 1}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${
                    shot.status === 'completed' ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' :
                    shot.status === 'generating' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' :
                    shot.status === 'failed' ? 'bg-red-500/20 border-red-500/40 text-red-300' :
                    'bg-gray-700 border-gray-600 text-gray-400'
                  }`}>{shot.status}</span>
                  {shot.status === 'completed' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${approvalColor(shot.approval_status)}`}>
                      {approvalLabel(shot.approval_status)}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm font-medium text-white truncate">{shot.shot_type}</div>
              <div className="text-xs text-gray-500 truncate mt-0.5">{shot.prompt || 'No prompt yet'}</div>
              <div className="text-xs text-gray-600 mt-0.5">{shot.duration}s · {shot.camera_movement}</div>
            </button>
          ))}
        </div>

        {/* Main Editor */}
        <div className="flex-1 overflow-y-auto p-6">
          {shots[activeShot] && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Shot {activeShot + 1}</h2>
                <div className="flex items-center gap-2">
                  {shots[activeShot].status === 'completed' && (
                    <>
                      <button
                        onClick={() => approveShot(activeShot)}
                        disabled={shots[activeShot].approval_status === 'approved'}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          shots[activeShot].approval_status === 'approved'
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-green-600/20 text-green-400 border border-green-500/40 hover:bg-green-600 hover:text-white'
                        }`}
                      >
                        {shots[activeShot].approval_status === 'approved' ? '✓ Approved' : 'Approve Shot'}
                      </button>
                      <button
                        onClick={() => rejectShot(activeShot)}
                        disabled={shots[activeShot].approval_status === 'rejected'}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          shots[activeShot].approval_status === 'rejected'
                            ? 'bg-red-700 text-white cursor-default'
                            : 'bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {shots[activeShot].approval_status === 'rejected' ? '✗ Rejected' : 'Reject / Redo'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => generateShot(activeShot)}
                    disabled={generating[activeShot] || !shots[activeShot].prompt}
                    className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-medium hover:bg-purple-500 disabled:opacity-50"
                  >
                    {generating[activeShot] ? 'Generating...' : shots[activeShot].status === 'completed' ? 'Regenerate' : 'Generate This Shot'}
                  </button>
                  {shots.length > 1 && (
                    <button onClick={() => removeShot(activeShot)} className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30">
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Video Preview */}
              <div className="mb-6 bg-gray-900 rounded-xl overflow-hidden">
                {shots[activeShot].video_url ? (
                  <div>
                    <video
                      src={shots[activeShot].video_url}
                      controls
                      className="w-full"
                    />
                    {shots[activeShot].approval_status === 'approved' && (
                      <div className="px-4 py-2 bg-green-500/10 border-t border-green-500/20 flex items-center gap-2">
                        <span className="text-green-400 text-sm">✓ Shot approved and queued for final stitch</span>
                        {approvedCount > 1 && (
                          <span className="text-xs text-green-300/70">— {approvedCount} shots ready, {allShotsDuration - totalDuration}s remaining to approve</span>
                        )}
                      </div>
                    )}
                    {shots[activeShot].approval_status === 'rejected' && (
                      <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
                        <span className="text-red-400 text-sm">✗ Shot rejected — edit the prompt and regenerate</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center text-gray-600">
                    {shots[activeShot].status === 'generating' ? (
                      <div className="text-center">
                        <div className="text-2xl mb-2 animate-pulse">🎬</div>
                        <p className="text-yellow-400">Generating cinematic shot...</p>
                        <p className="text-xs text-gray-500 mt-1">This may take 30–120 seconds</p>
                      </div>
                    ) : shots[activeShot].status === 'failed' ? (
                      <div className="text-center">
                        <div className="text-2xl mb-2">⚠️</div>
                        <p className="text-red-400">Generation failed</p>
                        <p className="text-xs text-gray-500 mt-1">Check your prompt and try again</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-2">🎬</div>
                        <p>No video yet</p>
                        <p className="text-sm mt-1">Enter a prompt and generate this shot</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shot Settings */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Shot Type</label>
                  <select
                    value={shots[activeShot].shot_type}
                    onChange={e => updateShot(activeShot, 'shot_type', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {SHOT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Camera Movement</label>
                  <select
                    value={shots[activeShot].camera_movement}
                    onChange={e => updateShot(activeShot, 'camera_movement', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                  >
                    {CAMERA_MOVES.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">Duration (seconds)</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">3s</span>
                  <input
                    type="range" min={3} max={10} step={1}
                    value={shots[activeShot].duration}
                    onChange={e => updateShot(activeShot, 'duration', Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold text-white w-8">{shots[activeShot].duration}s</span>
                  <span className="text-xs text-gray-500">10s</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Shot Prompt</label>
                <textarea
                  value={shots[activeShot].prompt}
                  onChange={e => updateShot(activeShot, 'prompt', e.target.value)}
                  rows={4}
                  placeholder="Describe this shot in detail..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm resize-none focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
