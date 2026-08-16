import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronDown, ExternalLink, Menu, X } from 'lucide-react'
import { cn } from '@cafe/shared-web'
import { EXTERNAL, NAV, type NavGroup, type NavLeaf } from '../navigation'

function DesktopLeaf({ leaf }: { leaf: NavLeaf }) {
  const className =
    'flex items-center justify-between gap-3 px-4 py-2 text-sm text-meteor-800 hover:bg-meteor-50 hover:text-meteor-600 transition-colors'
  return (
    <NavLink to={leaf.to ?? '#'} className={className}>
      {leaf.label}
    </NavLink>
  )
}

function DesktopGroup({ group }: { group: NavGroup }) {
  // The Reservation item links out and is rendered as a button (see Header).
  if (group.href) return null
  if (!group.children) {
    return (
      <NavLink
        to={group.to ?? '#'}
        className={({ isActive }) =>
          cn(
            'rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-meteor-900 hover:text-meteor-500 transition-colors',
            isActive && 'text-meteor-500',
          )
        }
      >
        {group.label}
      </NavLink>
    )
  }
  return (
    <div className="group relative">
      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wide text-meteor-900 hover:text-meteor-500 transition-colors"
        aria-haspopup="true"
      >
        {group.label}
        <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
      </button>
      <div className="invisible absolute left-0 top-full z-30 w-60 origin-top rounded-xl border border-meteor-100 bg-white py-2 opacity-0 shadow-lg shadow-meteor-900/10 transition-[opacity,visibility] duration-150 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {group.children.map((leaf) => (
          <DesktopLeaf key={leaf.label + (leaf.to ?? leaf.href)} leaf={leaf} />
        ))}
      </div>
    </div>
  )
}

function MobileGroup({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  const [open, setOpen] = useState(false)
  if (group.href) {
    return (
      <a
        href={group.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-3 text-base font-bold uppercase tracking-wide text-meteor-800"
      >
        {group.label}
        <ExternalLink className="h-4 w-4 opacity-60" />
      </a>
    )
  }
  if (!group.children) {
    return (
      <NavLink
        to={group.to ?? '#'}
        onClick={onNavigate}
        className="block px-4 py-3 text-base font-bold uppercase tracking-wide text-meteor-800"
      >
        {group.label}
      </NavLink>
    )
  }
  return (
    <div className="border-b border-meteor-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-base font-bold uppercase tracking-wide text-meteor-800"
      >
        {group.label}
        <ChevronDown className={cn('h-5 w-5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pb-2">
          {group.children.map((leaf) => (
            <NavLink
              key={leaf.label}
              to={leaf.to ?? '#'}
              onClick={onNavigate}
              className="block px-7 py-2 text-sm text-meteor-700"
            >
              {leaf.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b border-meteor-100 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:h-20">
        <Link to="/" className="flex items-center" aria-label="Meteor Community Cafe home">
          <img src="/meteor-logo.png" alt="Meteor Community Cafe" className="h-9 w-auto md:h-11" />
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((group) => (
              <DesktopGroup key={group.label} group={group} />
            ))}
          </nav>

          <a
            href={EXTERNAL.reservations}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden bg-meteor-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-meteor-600 sm:inline-block"
          >
            Reservation
          </a>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-2 text-meteor-700 lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-meteor-100 bg-white lg:hidden">
          <nav aria-label="Mobile" className="mx-auto max-w-6xl">
            {NAV.map((group) => (
              <MobileGroup
                key={group.label}
                group={group}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
