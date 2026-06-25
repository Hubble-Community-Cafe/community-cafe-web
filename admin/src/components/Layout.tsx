import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useMsal } from '@azure/msal-react'
import { BarChart3, ExternalLink, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@cafe/shared-web'
import { BrandLogos } from './BrandLogos'
import { NAV, canSee } from '../navigation'
import { useRole } from '../lib/RoleContext'
import { usePermissions } from '../lib/usePermissions'
import { isE2E } from '../lib/e2eAuth'

/** External link to the self-hosted analytics dashboard. */
const STATS_URL = 'https://stats.hubble.cafe'

/** Badge colour per role (keys match the uppercase AdminRole values). */
const ROLE_BADGE: Record<string, string> = {
  ADMIN: 'bg-hubble-100 text-hubble-700',
  EDITOR: 'bg-emerald-100 text-emerald-700',
  DDD_POSTER: 'bg-amber-100 text-amber-700',
  VIEWER: 'bg-slate-100 text-slate-500',
}

export function Layout() {
  const { instance } = useMsal()
  const { user, role } = useRole()
  const { isViewer, isEditor, isAdmin } = usePermissions()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = () => {
    if (isE2E()) return
    instance.logoutRedirect()
  }

  const sections = NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => canSee(item, { isViewer, isEditor, isAdmin })),
  })).filter((section) => section.items.length > 0)

  const nav = (
    <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Admin">
      {sections.map((section, i) => (
        <div key={section.title ?? i}>
          {section.title && (
            <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-hubble-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.placeholder && (
                    <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-400">
                      soon
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )

  const footer = (
    <div className="border-t border-slate-200 p-3">
      <div className="px-2 pb-2">
        <p className="truncate text-sm font-semibold text-slate-800">
          {user?.displayName || user?.email || 'Signed in'}
        </p>
        {role && (
          <span
            className={cn(
              'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              ROLE_BADGE[role] ?? 'bg-slate-100 text-slate-500',
            )}
          >
            {role.replace('_', ' ')}
          </span>
        )}
      </div>
      <a
        href={STATS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <BarChart3 className="h-4 w-4" />
        Statistics
        <ExternalLink className="ml-auto h-3.5 w-3.5 text-slate-400" />
      </a>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  )

  const brand = (
    <Link
      to="/"
      className="flex flex-col gap-1.5 px-4 py-4"
      aria-label="Community Cafe admin home"
    >
      <BrandLogos className="flex-row items-center gap-2" size={30} />
      <span className="text-xs font-normal text-slate-400">Staff &amp; board admin</span>
    </Link>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Desktop sidebar: fixed, does not scroll with the content */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          {brand}
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="rounded-md p-2 text-slate-600"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {mobileOpen && (
          <div className="flex max-h-[calc(100vh-3.5rem)] flex-col overflow-y-auto border-b border-slate-200 bg-white lg:hidden">
            {nav}
            {footer}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
