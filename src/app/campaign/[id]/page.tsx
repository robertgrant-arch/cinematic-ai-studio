'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import { type Shot, type Project, DEFAULT_SHOTS, SHOT_TYPES, CAMERA_MOVEMENTS } from '@/lib/types'

export default function CampaignPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [shots, setShots] = useState<Shot[]>([...DEFAULT_SHOTS])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [generating, setGenerating] = useState<Record<number, boolean>>({})
  const [stitching, setStitching] = useState(false)
  const [stitchError, setStitchError] = useState<string | null>(null)
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load project
  useEffect(() => {
    if (!projectId) return
    const loadProject = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/campaigns/${projectId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Campaign not found')
            return
          }
          throw new Error('Failed to load campaign')
        }
        const data = await res.json()
        if (data.ok && data.data) {
          setProject(data.data)
          if (data.data.shots?.length > 0) {
            setShots(data.data.shots)
          } else {
            setShots([...DEFAULT_SHOTS])
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }
    loadProject()
  }, [projectId])

  const updateShot = (index: number, field: keyof Shot, value: any) => {
    setShots(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      debouncedSave(updated)
      return updated
    })
  }

  const addShot = () => {
    const newShot: Shot = {
      id: crypto.randomUUID(),
      order_index: shots.length,
      prompt: '',
      shot_type: 'wide',
      camera_movement: 'static',
      duration: 5,
      status: 'draft',
      approval_status: 'pending',
      video_url: null,
    }
    const updated = [...shots, newShot]
    setShots(updated)
    debouncedSave(updated)
  }

  const removeShot = (index: number) => {
    if (shots.length <= 1) return alert('Need at least one shot')
    const updated = shots.filter((_, i) => i !== index).map((s, i) => ({ ...s, order_index: i }))
    setShots(updated)
    debouncedSave(updated)
  }

  const approveShot = (index: number) => {
    updateShot(index, 'approval_status', shots[index].approval_status === 'approved' ? 'pending' : 'approved')
  }

  const rejectShot = (index: number) => {
    updateShot(index, 'approval_status', 'rejected')
    updateShot(index, 'status', 'draft')
  }

  // Auto-save (debounced)
  const saveShots = useCallback(async (shotsToSave: Shot[]) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/campaigns/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shots: shotsToSave }),
      })
      if (res.ok) {
        const data = await res.json()
        const saved = data.data?.shots || data.shots
        if (saved && saved.length > 0) setShots(saved)
        setLastSaved(new Date().toLocaleTimeString())
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
    } finally {
      setSaving(false)
    }
  }, [projectId])

  const debouncedSave = useCallback((updatedShots: Shot[]) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => saveShots(updatedShots), 2000)
  }, [saveShots])

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
          projectId, shotId: shot.id,
          prompt: `${shot.shot_type}: ${shot.prompt}. Camera: ${shot.camera_movement}. Cinematic commercial quality, professional lighting, 4K.`,
          model: 'kling', duration: shot.duration, aspectRatio: '16:9',
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
      if (shots[i].prompt && shots[i].status !== 'completed') await generateShot(i)
    }
  }

  const stitchFinalVideo = async () => {
    const approvedShots = shots.filter(s => s.approval_status === 'approved' && s.video_url)
    if (approvedShots.length < 2) return alert('Need at least 2 approved shots with videos.')
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
      if (data.videoUrl) setFinalVideoUrl(data.videoUrl)
      else setStitchError(data.error || 'Stitching failed')
    } catch (err: any) {
      setStitchError(err.message || 'Stitching failed')
    } finally { setStitching(false) }
  }

  const approvedCount = shots.filter(s => s.approval_status === 'approved' && s.video_url).length
  const completedCount = shots.filter(s => s.status === 'completed').length
  const totalDuration = shots.filter(s => s.approval_status === 'approved').reduce((sum, s) => sum + s.duration, 0)

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><p>Loading campaign...</p></div>
  if (error) return <div className="min-h-screen bg-black text-white flex items-center justify-center"><div className="text-center"><p className="text-red-400 mb-4">{error}</p><button onClick={() => router.push('/dashboard')} className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">Back to Dashboard</button></div></div>

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-white/60 hover:text-white">&larr; Back</button>
            <h1 className="text-xl font-bold">{project?.title || 'Campaign'}</h1>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-yellow-400 text-sm">Saving...</span>}
            {lastSaved && !saving && <span className="text-green-400 text-sm">Saved {lastSaved}</span>}
            <span className="text-white/40 text-sm">{completedCount}/{shots.length} generated</span>
            <span className="text-white/40 text-sm">{approvedCount} approved</span>
            <span className="text-white/40 text-sm">{totalDuration}s total</span>
          </div>
        </div>
      </header>

      {/* Actions Bar */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-3">
        <button onClick={addShot} className="px-3 py-1.5 bg-white/10 rounded text-sm hover:bg-white/20">+ Add Shot</button>
        <button onClick={generateAll} className="px-3 py-1.5 bg-blue-600 rounded text-sm hover:bg-blue-700">Generate All</button>
        <button onClick={stitchFinalVideo} disabled={stitching || approvedCount < 2} className="px-3 py-1.5 bg-green-600 rounded text-sm hover:bg-green-700 disabled:opacity-50">{stitching ? 'Stitching...' : 'Stitch Final Video'}</button>
        {stitchError && <span className="text-red-400 text-sm">{stitchError}</span>}
        {finalVideoUrl && <a href={finalVideoUrl} target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm underline">Download Final Video</a>}
      </div>

      {/* Shot List */}
      <div className="p-6 space-y-4">
        {shots.map((shot, index) => (
          <div key={shot.id || index} className="border border-white/10 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="text-white/40 font-mono text-sm pt-2">#{index + 1}</div>
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <select value={shot.shot_type} onChange={e => updateShot(index, 'shot_type', e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm">
                    {SHOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={shot.camera_movement} onChange={e => updateShot(index, 'camera_movement', e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm">
                    {CAMERA_MOVEMENTS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input type="number" value={shot.duration} onChange={e => updateShot(index, 'duration', parseInt(e.target.value) || 5)} min={1} max={30} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm w-20" />
                  <span className="text-white/40 text-sm pt-1">sec</span>
                </div>
                <textarea value={shot.prompt} onChange={e => updateShot(index, 'prompt', e.target.value)} placeholder="Describe this shot..." rows={2} className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm resize-none" />
                {shot.video_url && (
                  <video src={shot.video_url} controls className="w-full max-w-md rounded" />
                )}
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${shot.status === 'completed' ? 'bg-green-900 text-green-300' : shot.status === 'generating' ? 'bg-blue-900 text-blue-300' : shot.status === 'failed' ? 'bg-red-900 text-red-300' : 'bg-white/5 text-white/40'}`}>{shot.status}</span>
                  {shot.approval_status !== 'pending' && (
                    <span className={`text-xs px-2 py-0.5 rounded ${shot.approval_status === 'approved' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{shot.approval_status}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => generateShot(index)} disabled={generating[index] || !shot.prompt} className="px-3 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700 disabled:opacity-50">{generating[index] ? 'Gen...' : 'Generate'}</button>
                <button onClick={() => approveShot(index)} disabled={shot.status !== 'completed'} className={`px-3 py-1 rounded text-xs ${shot.approval_status === 'approved' ? 'bg-green-600' : 'bg-white/10 hover:bg-white/20'} disabled:opacity-50`}>{shot.approval_status === 'approved' ? 'Approved' : 'Approve'}</button>
                <button onClick={() => rejectShot(index)} disabled={shot.status !== 'completed'} className="px-3 py-1 bg-white/10 rounded text-xs hover:bg-red-600/50 disabled:opacity-50">Reject</button>
                <button onClick={() => removeShot(index)} className="px-3 py-1 bg-white/10 rounded text-xs hover:bg-red-600/50 text-red-400">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
