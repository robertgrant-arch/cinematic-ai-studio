'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STYLES = [
  { id: 'cinematic', label: 'Cinematic', desc: 'Film-quality dramatic lighting and composition' },
  { id: 'luxury', label: 'Luxury', desc: 'High-end premium aesthetic with elegant movement' },
  { id: 'dynamic', label: 'Dynamic', desc: 'Fast-paced energetic cuts and motion' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, simple, modern aesthetic' },
  { id: 'editorial', label: 'Editorial', desc: 'Magazine-style storytelling approach' },
]

const MODELS = [
  { id: 'kling', label: 'Kling 1.6', desc: 'Best for cinematic product shots' },
  { id: 'veo', label: 'Google Veo 2', desc: 'Excellent photorealism and physics' },
  { id: 'wan', label: 'Wan 2.1', desc: 'Great for artistic and stylized content' },
  { id: 'hailuo', label: 'Hailuo Minimax', desc: 'Fast generation with good quality' },
]

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    productName: '',
    productDescription: '',
    targetAudience: '',
    style: 'cinematic',
    model: 'kling',
    description: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.project) {
        router.push(`/campaign/${data.project.id}`)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-white mb-8 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-4xl font-bold mb-2">New Campaign</h1>
        <p className="text-gray-400 mb-10">
          Define your product and creative vision for cinematic commercial generation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Summer Product Launch 2025"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Product Name</label>
              <input
                type="text"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="e.g. AeroFit Pro Sneakers"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
              <input
                type="text"
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="e.g. Active millennials aged 25-40"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Product Description</label>
            <textarea
              value={form.productDescription}
              onChange={(e) => setForm({ ...form, productDescription: e.target.value })}
              rows={3}
              placeholder="Describe your product features, unique selling points, and brand story..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">Visual Style</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setForm({ ...form, style: s.id })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    form.style === s.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">{s.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">AI Video Model</label>
            <div className="grid grid-cols-2 gap-3">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setForm({ ...form, model: m.id })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    form.model === m.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">{m.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Creative Brief */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Creative Brief (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Describe the overall mood, tone, and narrative arc you envision for this commercial..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.name}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Campaign...' : 'Create Campaign & Start Directing'}
          </button>
        </form>
      </div>
    </div>
  )
}
