import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-zinc-800 p-4 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-semibold">Studio</span>
        </div>
        <nav className="space-y-1 flex-1">
          {[
            { label: 'Dashboard', href: '/dashboard', active: true },
            { label: 'Campaigns', href: '/dashboard/campaigns' },
            { label: 'Brand Kit', href: '/dashboard/brand' },
            { label: 'Research', href: '/dashboard/research' },
            { label: 'Settings', href: '/dashboard/settings' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className={`block px-3 py-2 rounded-lg text-sm ${item.active ? 'bg-violet-600/20 text-violet-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>{item.label}</Link>
          ))}
        </nav>
        <div className="text-xs text-zinc-500 mt-auto">{user.email}</div>
      </aside>

      <main className="flex-1 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-zinc-400 text-sm mt-1">Your cinematic commercial projects</p>
          </div>
          <Link href="/dashboard/campaigns/new" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-white text-sm font-medium">+ New Campaign</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[{ label: 'Campaigns', value: projects?.length || 0 }, { label: 'Shots', value: 0 }, { label: 'Exports', value: 0 }, { label: 'Credits', value: '$0' }].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4"><p className="text-xs text-zinc-500">{s.label}</p><p className="text-2xl font-bold mt-1">{s.value}</p></div>
          ))}
        </div>

        {!projects?.length ? (
          <div className="glass rounded-xl p-12 text-center">
            <h3 className="font-semibold text-lg mb-2">No campaigns yet</h3>
            <p className="text-zinc-400 text-sm mb-6">Create your first cinematic product commercial</p>
            <Link href="/dashboard/campaigns/new" className="px-6 py-2 bg-violet-600 rounded-lg text-white text-sm font-medium">Create Campaign</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p: any) => (
              <Link key={p.id} href={`/dashboard/campaigns/${p.id}`} className="glass rounded-xl p-5 hover:border-violet-600/50 transition">
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{p.status || 'draft'}</span>
                <h3 className="font-semibold mt-3 mb-1">{p.name}</h3>
                <p className="text-sm text-zinc-400 line-clamp-2">{p.brief || 'No brief'}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
