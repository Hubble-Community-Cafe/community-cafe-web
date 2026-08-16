import { useEffect, useState } from 'react'
import { getWeeklyHours, groupWeeklyHours, groupKitchenHours, type WeeklyHours } from '@cafe/shared-web'
import { usePageSeo } from '../lib/seo'

/**
 * Full-bleed kiosk screen for the vertical display out front of Hubble (portrait 4K). No nav or
 * footer: a rotating promotional hero plus the opening times. Text is sized in vw (the screen's
 * narrow dimension) so it stays readable and never wraps on the tall 4K panel. Refreshes its data
 * and reloads itself periodically so it never goes stale. No live open/closed indicator by design:
 * the bar sometimes opens without the hours being edited.
 */
const HEROES: { img: string; title: string; subtitle: string }[] = [
  { img: '/images/feature-campus.jpg', title: 'Living room of the campus', subtitle: 'Where the TU/e community meets' },
  { img: '/images/feature-food.jpg', title: 'Brunch & dinner', subtitle: 'Good, affordable food all day' },
  { img: '/images/feature-versatility.jpg', title: 'Drinks, events & more', subtitle: 'A cafe by day, a bar by night' },
  { img: '/images/hero-duck.jpg', title: 'Welcome to Hubble', subtitle: 'Open to everyone on campus' },
]
const ROTATE_MS = 8000
const HOURS_REFRESH_MS = 10 * 60 * 1000
const RELOAD_MS = 60 * 60 * 1000
// The order manager (food.hubble.cafe) exposes the ready order numbers as JSON; poll it often.
// Until that endpoint exists the fetch just fails and the panel stays hidden.
const ORDERS_URL = 'https://food.hubble.cafe/api/orders'
const ORDERS_REFRESH_MS = 4000

export function PlazaPage() {
  usePageSeo('Plaza', 'The Hubble plaza display.', { index: false })
  const [hours, setHours] = useState<WeeklyHours[]>([])
  const [active, setActive] = useState(0)
  const [orders, setOrders] = useState<string[]>([])

  useEffect(() => {
    const load = () => getWeeklyHours('HUBBLE').then(setHours).catch(() => {})
    load()
    const id = setInterval(load, HOURS_REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setActive((p) => (p + 1) % HEROES.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  // Ready order numbers from the order manager. Best-effort: on any error keep the last list.
  useEffect(() => {
    const load = () =>
      fetch(ORDERS_URL)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
        .then((d: { orders?: unknown }) =>
          setOrders(Array.isArray(d.orders) ? d.orders.map(String) : []))
        .catch(() => {})
    load()
    const id = setInterval(load, ORDERS_REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => window.location.reload(), RELOAD_MS)
    return () => clearInterval(id)
  }, [])

  const weekly = groupWeeklyHours(hours)
  const kitchen = groupKitchenHours(hours)

  return (
    <div className="fixed inset-0 flex h-screen w-screen cursor-none flex-col overflow-hidden bg-gradient-to-b from-hubble-700 to-hubble-900 text-white">
      <header className="flex shrink-0 items-center justify-center py-[2.5vh]">
        <img src="/hubble-logo-white.png" alt="Hubble Community Cafe" className="h-[6vh] w-auto" />
      </header>

      {/* Rotating promotional hero */}
      <div className="relative mx-[3vw] flex-1 overflow-hidden rounded-[1.5vw]">
        {HEROES.map((h, i) => (
          <div
            key={h.img}
            // Curve pinned explicitly: the shared theme overrides Tailwind's --ease-in-out
            // with a punchy UI curve, which would make this slow kiosk dissolve lurch.
            className="absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ opacity: i === active ? 1 : 0 }}
            aria-hidden={i !== active}
          >
            <img src={h.img} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-[4vh] px-[5vw] text-center">
              <h2 className="font-title text-[5vw] font-bold leading-[1.05] drop-shadow-lg">{h.title}</h2>
              <p className="mt-[1.2vh] text-[2.7vw] text-white/90 drop-shadow">{h.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Ready orders (only shown when the order manager reports any) */}
      {orders.length > 0 && (
        <section className="shrink-0 bg-hubble-50 px-[5vw] py-[2.5vh] text-hubble-900">
          <h2 className="text-center font-title text-[3vw] font-bold uppercase tracking-wide text-hubble-700">
            {orders.length === 1 ? 'Order ready' : 'Orders ready'}
          </h2>
          <div className="mt-[1.5vh] flex flex-wrap justify-center gap-[2vw]">
            {orders.map((n) => (
              <span key={n} className="rounded-[1vw] bg-hubble-700 px-[3vw] py-[0.8vh] text-[5vw] font-bold tabular-nums text-white">
                {n}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Opening times */}
      <section className="shrink-0 px-[6vw] py-[3vh]">
        <h1 className="mb-[2vh] text-center font-title text-[4vw] font-bold uppercase tracking-wide text-hubble-200">
          Opening Times
        </h1>
        {weekly.length === 0 ? (
          <p className="text-center text-[2.8vw] text-white/60">Hours unavailable</p>
        ) : (
          <dl className="mx-auto w-[88vw] text-[3.3vw]">
            {weekly.map((g) => (
              <div key={g.label} className="flex items-baseline justify-between gap-[4vw] border-b border-white/15 py-[1.3vh]">
                <dt className="whitespace-nowrap font-semibold">{g.label}</dt>
                <dd className="whitespace-nowrap tabular-nums">{g.open} &ndash; {g.close}</dd>
              </div>
            ))}
            {kitchen.map((k) => (
              <div key={k.label} className="flex items-baseline justify-between gap-[4vw] py-[1.3vh] text-[2.5vw] text-white/70">
                <dt className="whitespace-nowrap">{k.label}</dt>
                <dd className="whitespace-nowrap tabular-nums">{k.open} &ndash; {k.close}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  )
}
