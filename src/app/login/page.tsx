'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold">C</div>
          <span className="font-bold text-xl">Cinematic AI Studio</span>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                required
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                required
                minLength={6}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium text-sm transition disabled:opacity-50"
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-zinc-400 text-center mt-4">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="text-violet-400 hover:underline">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">Back to home</Link>
        </p>
      </div>
    </div>
  )
}
