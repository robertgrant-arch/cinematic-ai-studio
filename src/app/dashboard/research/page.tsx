import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ResearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-zinc-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-semibold">Studio</span>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Campaigns', href: '/dashboard' },
            { label: 'Brand Kit', href: '/dashboard/brand' },
            { label: 'Research', href: '/dashboard/research', active: true },
            { label: 'Settings', href: '/dashboard/settings' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className={`block px-3 py-2 rounded-lg text-sm ${(item as any).active ? 'bg-violet-600/20 text-violet-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>{item.label}</Link>
          ))}
        </nav>
        <div className="text-xs text-zinc-500 mt-auto">{user.email}</div>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-2">Market Research</h1>
        <p className="text-zinc-400 text-sm mb-8">AI-powered competitive intelligence and audience insights</p>
        <div className="glass rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">🔬</div>
          <h3 className="font-semibold text-lg mb-2">Research Tools Coming Soon</h3>
          <p className="text-zinc-400 text-sm">Competitor analysis, audience profiling, and trend reports will be available here.</p>
        </div>
      </main>
    </div>
  )
}
