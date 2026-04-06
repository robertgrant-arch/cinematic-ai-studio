import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-semibold text-lg">Cinematic AI Studio</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">Sign In</Link>
          <Link href="/login" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 rounded-lg text-white transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-700 text-xs text-zinc-400 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Multi-model AI video generation
        </div>
        <h1 className="text-5xl md:text-7xl font-bold max-w-4xl leading-tight">
          Production-grade <span className="gradient-text">cinematic commercials</span> powered by AI
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl">
          Research-driven creative strategy, multi-model shot generation, director-grade controls, and one-click export. From brief to finished commercial in minutes.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/login" className="px-8 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-medium transition">
            Start Creating
          </Link>
          <Link href="#features" className="px-8 py-3 border border-zinc-700 hover:border-zinc-500 rounded-lg text-zinc-300 font-medium transition">
            See How It Works
          </Link>
        </div>

        {/* Feature Grid */}
        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {[
            { title: 'AI Research Engine', desc: 'Deep competitor and market analysis before a single frame is generated. GPT, Claude, and Gemini work together.', icon: 'R' },
            { title: 'Multi-Model Routing', desc: 'Veo 3.1, Kling 3, Sora 2 Pro, and more. Each shot uses the best model for the job via fal.ai.', icon: 'M' },
            { title: 'Storyboard Planner', desc: 'AI generates scene-by-scene storyboards with camera angles, timing, and continuity references.', icon: 'S' },
            { title: 'Shot Generation', desc: 'Text-to-video and image-to-video with brand consistency, product continuity, and cinematic quality.', icon: 'G' },
            { title: 'Timeline Editor', desc: 'Reorder, trim, replace, and regenerate individual shots. Full creative control over every frame.', icon: 'T' },
            { title: 'Export Pipeline', desc: '16:9, 9:16, 1:1 formats. Captions, music, voice, and client review links built in.', icon: 'E' },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl p-6 text-left">
              <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-sm text-zinc-500">
        Cinematic AI Studio &mdash; Built for production-grade commercial video.
      </footer>
    </div>
  )
}
