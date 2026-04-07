import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SettingsPage() {
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
            { label: 'Research', href: '/dashboard/research' },
            { label: 'Settings', href: '/dashboard/settings', active: true },
          ].map((item) => (
            <Link key={item.label} href={item.href} className={`block px-3 py-2 rounded-lg text-sm ${(item as any).active ? 'bg-violet-600/20 text-violet-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}>{item.label}</Link>
          ))}
        </nav>
        <div className="text-xs text-zinc-500 mt-auto">{user.email}</div>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-zinc-400 text-sm mb-8">Manage your account and preferences</p>
        <div className="max-w-lg space-y-6">
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-1">Account</h3>
            <p className="text-zinc-400 text-sm mb-4">Signed in as <span className="text-white">{user.email}</span></p>
            <form action="/auth/signout" method="post">
              <button type="submit" className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-600/30 transition">Sign Out</button>
            </form>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-1">API & Integrations</h3>
            <p className="text-zinc-400 text-sm">API key management and third-party integrations coming soon.</p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="font-semibold mb-1">Billing</h3>
            <p className="text-zinc-400 text-sm">Subscription management and usage billing coming soon.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
