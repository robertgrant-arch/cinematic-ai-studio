import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function BrandKitPage() {
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
            { label: 'Brand Kit', href: '/dashboard/brand', active: true },
            { label: 'Research', href: '/dashboard/research' },
            { label: 'Settings', href: '/dashboard/settings' },
          ].map((item) => (
            <Link key={item.label} href={item.href} className={`block px-3 py-2 rounded-lg text-sm ${(item as any).active ? 'bg-violet-600/20 text-violet-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>{item.label}</Link>
          ))}
        </nav>
        <div className="text-xs text-zinc-500 mt-auto">{user.email}</div>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-2">Brand Kit</h1>
        <p className="text-zinc-400 text-sm mb-8">Manage your brand assets, colors, fonts, and visual identity</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-3">🎨 Brand Colors</h3>
            <p className="text-zinc-400 text-sm">Upload your brand color palette to ensure consistent visuals across all campaigns.</p>
            <button className="mt-4 px-4 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg text-sm hover:bg-violet-600/30 transition" disabled>Coming Soon</button>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-3">🔤 Fonts & Typography</h3>
            <p className="text-zinc-400 text-sm">Set your brand fonts for title cards, lower thirds, and text overlays.</p>
            <button className="mt-4 px-4 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg text-sm hover:bg-violet-600/30 transition" disabled>Coming Soon</button>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-3">🖼️ Logo Library</h3>
            <p className="text-zinc-400 text-sm">Upload logos in multiple formats for automatic outro and watermark insertion.</p>
            <button className="mt-4 px-4 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg text-sm hover:bg-violet-600/30 transition" disabled>Coming Soon</button>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-3">🎬 Brand Voice</h3>
            <p className="text-zinc-400 text-sm">Define your brand tone and messaging guidelines for AI prompt generation.</p>
            <button className="mt-4 px-4 py-2 bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg text-sm hover:bg-violet-600/30 transition" disabled>Coming Soon</button>
          </div>
        </div>
      </main>
    </div>
  )
}
