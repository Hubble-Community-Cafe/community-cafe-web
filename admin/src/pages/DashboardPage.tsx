import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, PageHeader } from '../components/PageHeader'
import { useRole } from '../lib/RoleContext'
import { usePermissions } from '../lib/usePermissions'
import { NAV, canSee } from '../navigation'
import {
  fetchDailyDishes, fetchEvents, fetchOverrides, fetchAuditLog,
  type AdminRole, type BarLocation, type DailyDish, type CafeEvent,
  type HoursOverride, type AuditLogEntry,
} from '../lib/api'

const ROLE_LABELS: Record<AdminRole, string> = {
  VIEWER: 'Viewer',
  DDD_POSTER: 'DDD poster',
  EDITOR: 'Editor',
  ADMIN: 'Admin',
}

// ── Date / format helpers ──────────────────────────────────────────────────────

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const todayStr = () => localDateStr(new Date())
function inDaysStr(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return localDateStr(d)
}
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

// ── Small UI bits ──────────────────────────────────────────────────────────────

function CardLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</p>
}

function BarBadge({ bar }: { bar: BarLocation }) {
  const cls = bar === 'HUBBLE' ? 'bg-hubble-50 text-hubble-700' : 'bg-emerald-50 text-emerald-700'
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
      {bar === 'HUBBLE' ? 'Hubble' : 'Meteor'}
    </span>
  )
}

function CardLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-hubble-600 hover:underline">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  )
}

const Loading = () => <p className="mt-2 text-sm text-slate-400">Loading…</p>

// ── Widgets ─────────────────────────────────────────────────────────────────────

function DailyDishWidget() {
  const [dish, setDish] = useState<DailyDish | null | undefined>(undefined)

  useEffect(() => {
    fetchDailyDishes()
      .then((list) => setDish(list.find((d) => d.date === todayStr()) ?? null))
      .catch(() => setDish(null))
  }, [])

  return (
    <Card>
      <CardLabel>Today&rsquo;s daily dish</CardLabel>
      {dish === undefined ? (
        <Loading />
      ) : dish ? (
        <>
          <p className="mt-2 font-title text-lg font-bold text-slate-800">{dish.name}</p>
          <p className="text-sm text-slate-500">{formatDate(dish.date)}</p>
          <CardLink to="/daily-dish">Manage</CardLink>
        </>
      ) : (
        <>
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-amber-600">
            <AlertTriangle className="h-4 w-4" /> No dish set for today
          </p>
          <CardLink to="/daily-dish">Add today&rsquo;s dish</CardLink>
        </>
      )}
    </Card>
  )
}

function EventsWidget() {
  const [events, setEvents] = useState<CafeEvent[] | undefined>(undefined)

  useEffect(() => {
    Promise.all([fetchEvents('HUBBLE'), fetchEvents('METEOR')])
      .then(([h, m]) => {
        const today = todayStr()
        const upcoming = [...h, ...m]
          .filter((e) => e.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 3)
        setEvents(upcoming)
      })
      .catch(() => setEvents([]))
  }, [])

  return (
    <Card>
      <CardLabel>Upcoming events</CardLabel>
      {events === undefined ? (
        <Loading />
      ) : events.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No upcoming events.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {events.map((e) => (
            <li key={`${e.bar}-${e.id}`} className="flex items-center gap-2 text-sm">
              <BarBadge bar={e.bar} />
              <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{e.title}</span>
              <span className="shrink-0 text-xs text-slate-400">{formatDate(e.date)}</span>
              {!e.published && (
                <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-600">
                  draft
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <CardLink to="/events">All events</CardLink>
    </Card>
  )
}

function OverridesWidget() {
  const [overrides, setOverrides] = useState<HoursOverride[] | undefined>(undefined)

  useEffect(() => {
    Promise.all([fetchOverrides('HUBBLE'), fetchOverrides('METEOR')])
      .then(([h, m]) => {
        const today = todayStr()
        const horizon = inDaysStr(14)
        const list = [...h, ...m]
          .filter((o) => o.date >= today && o.date <= horizon)
          .sort((a, b) => a.date.localeCompare(b.date))
        setOverrides(list)
      })
      .catch(() => setOverrides([]))
  }, [])

  return (
    <Card>
      <CardLabel>Special hours (next 2 weeks)</CardLabel>
      {overrides === undefined ? (
        <Loading />
      ) : overrides.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No special hours in the next two weeks.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {overrides.map((o) => (
            <li key={`${o.bar}-${o.id}`} className="flex items-center gap-2 text-sm">
              <BarBadge bar={o.bar} />
              <span className="shrink-0 text-xs text-slate-400">{formatDate(o.date)}</span>
              <span className="min-w-0 flex-1 truncate text-slate-700">
                {o.closed ? 'Closed' : `${o.open ?? '?'}–${o.close ?? '?'}`}
                {o.note ? ` · ${o.note}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
      <CardLink to="/hours">Manage hours</CardLink>
    </Card>
  )
}

function AuditWidget() {
  const [entries, setEntries] = useState<AuditLogEntry[] | undefined>(undefined)

  useEffect(() => {
    fetchAuditLog(0, 5)
      .then((p) => setEntries(p.content))
      .catch(() => setEntries([]))
  }, [])

  return (
    <Card>
      <CardLabel>Recent activity</CardLabel>
      {entries === undefined ? (
        <Loading />
      ) : entries.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No activity yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {entries.map((a) => (
            <li key={a.id} className="text-sm">
              <span className="font-medium text-slate-700">{a.actorName ?? a.actorEmail ?? 'Someone'}</span>{' '}
              <span className="text-slate-500">
                {a.action.toLowerCase()} {a.entityLabel ?? a.entityType.toLowerCase()}
              </span>
              <span className="ml-1 text-xs text-slate-400">· {timeAgo(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
      <CardLink to="/audit">Full audit log</CardLink>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, role, isLoading } = useRole()
  const { isViewer, isEditor, isAdmin, isDddPoster } = usePermissions()

  const tiles = (NAV.find((s) => s.title === 'Content')?.items ?? [])
    .filter((item) => canSee(item, { isViewer, isEditor, isAdmin }))

  return (
    <>
      <PageHeader
        title={`Welcome${user?.displayName ? `, ${user.displayName}` : ''}`}
        description="The shared admin for Hubble and Meteor. Manage content once; it publishes to the right site."
      />

      {/* Quick-nav grid */}
      {tiles.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-hubble-300 hover:shadow-md"
            >
              <item.icon className="h-6 w-6 text-hubble-600" />
              <span className="text-sm font-semibold text-slate-700">{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardLabel>Your role</CardLabel>
          <p className="mt-2 font-title text-2xl font-bold text-slate-800">
            {isLoading ? '…' : role ? ROLE_LABELS[role] : 'Unknown'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? 'Full access, including users and the audit log.'
              : isEditor
                ? 'You can edit the content modules.'
                : isDddPoster
                  ? 'You can view all content and edit the Daily Dinner Dish.'
                  : 'Read-only access. Ask an admin for edit rights.'}
          </p>
        </Card>

        {isDddPoster && <DailyDishWidget />}
        <EventsWidget />
        <OverridesWidget />
        {isAdmin && <AuditWidget />}

        <Card>
          <CardLabel>Sites</CardLabel>
          <p className="mt-2 text-sm text-slate-600">Live</p>
          <p className="text-sm">
            <a className="text-hubble-600 hover:underline" href="https://hubble.cafe">hubble.cafe</a>
            {' · '}
            <a className="text-hubble-600 hover:underline" href="https://meteor.cafe">meteor.cafe</a>
          </p>
          <p className="mt-2 text-sm text-slate-600">Test</p>
          <p className="text-sm">
            <a className="text-hubble-600 hover:underline" href="https://test.hubble.cafe">test.hubble.cafe</a>
            {' · '}
            <a className="text-hubble-600 hover:underline" href="https://test.meteor.cafe">test.meteor.cafe</a>
          </p>
        </Card>
      </div>
    </>
  )
}
