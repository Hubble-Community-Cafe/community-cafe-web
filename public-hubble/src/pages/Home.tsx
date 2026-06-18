import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { getWeeklyHours, getUpcomingOverrides, type WeeklyHours, type HoursOverride } from '@cafe/shared-web'
import { EXTERNAL } from '../navigation'

const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday',
}

const DAY_ORDER = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']

function formatOverrideDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function collapse<T extends { dayOfWeek: string }>(
  items: T[],
  sameGroup: (a: T, b: T) => boolean,
): T[][] {
  const sorted = [...items].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek))
  const groups: T[][] = []
  for (const item of sorted) {
    const last = groups[groups.length - 1]
    if (last && sameGroup(last[0], item) &&
        DAY_ORDER.indexOf(item.dayOfWeek) === DAY_ORDER.indexOf(last[last.length - 1].dayOfWeek) + 1) {
      last.push(item)
    } else {
      groups.push([item])
    }
  }
  return groups
}

function rangeLabel(g: { dayOfWeek: string }[]): string {
  return g.length === 1
    ? DAY_LABELS[g[0].dayOfWeek]
    : `${DAY_LABELS[g[0].dayOfWeek]} – ${DAY_LABELS[g[g.length - 1].dayOfWeek]}`
}

function groupHours(hours: WeeklyHours[]) {
  return collapse(hours, (a, b) => a.open === b.open && a.close === b.close).map((g) => ({
    label: rangeLabel(g),
    open: g[0].open,
    close: g[0].close,
  }))
}

function groupKitchenHours(hours: WeeklyHours[]) {
  const withKitchen = hours.filter((h) => h.kitchenOpen || h.kitchenClose)
  return collapse(withKitchen, (a, b) => a.kitchenOpen === b.kitchenOpen && a.kitchenClose === b.kitchenClose)
    .map((g) => ({
      label: `Kitchen (${rangeLabel(g)})`,
      open: g[0].kitchenOpen ?? '–',
      close: g[0].kitchenClose ?? '–',
    }))
}

const FEATURES = [
  {
    image: '/images/feature-campus.jpg',
    title: 'A Lively Campus',
    body: 'Backing many student associations formerly resident in the Bunker, we provide a place for like-minded people to connect and enjoy. Live music, open mic nights, and other activities draw crowds. With plenty of opportunities to meet new people on campus, we are the place to be.',
  },
  {
    image: '/images/feature-food.jpg',
    title: 'Brunch & Dinner',
    body: 'During the day, before lectures, at lunch time, and in the early evening, we welcome everyone to enjoy a quick, affordable meal. Not just the international students in the nearby towers, but anyone preparing for a long day of study in MetaForum. Fuel for the brain is good food in good company.',
  },
  {
    image: '/images/feature-versatility.jpg',
    title: 'Versatility',
    body: 'A bar for students, but also a cafe for companies, staff, and expats. A place to eat, drink, meet, relax, and party. Available for activities from Studium Generale, scientific congresses, international students, and any and all associations of the TU/e campus.',
  },
]

export function Home() {
  const [hours, setHours] = useState<WeeklyHours[]>([])
  const [hoursLoaded, setHoursLoaded] = useState(false)
  const [overrides, setOverrides] = useState<HoursOverride[]>([])

  useEffect(() => {
    getWeeklyHours('HUBBLE')
      .then(setHours)
      .catch(() => {})
      .finally(() => setHoursLoaded(true))
    getUpcomingOverrides('HUBBLE').then(setOverrides).catch(() => {})
  }, [])

  const allDays = DAY_ORDER.map((d) => ({ day: d, slot: hours.find((h) => h.dayOfWeek === d) ?? null }))
  const grouped = groupHours(hours)
  const hasKitchen = hours.some((h) => h.kitchenOpen || h.kitchenClose)

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:py-10">
      {/* Hero: the "floating gold" duck with the tagline overlaid. */}
      <section className="relative overflow-hidden rounded-2xl shadow-xl shadow-hubble-950/30">
        <img
          src="/images/hero-duck.jpg"
          alt="Hubble's floating gold: the giant rubber duck on the TU/e campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-hubble-950/55" />
        <div className="relative px-6 py-16 text-center text-white md:px-12 md:py-24">
          <h1 className="mx-auto max-w-3xl font-title text-3xl font-bold leading-tight drop-shadow md:text-5xl">
            Enjoy our floating gold in the sunshine
          </h1>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            <a
              href={EXTERNAL.foodTracker}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-hubble-800/70 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-hubble-700"
            >
              Food Tracker
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              to="/cafe/menu"
              className="inline-flex items-center justify-center bg-hubble-800/70 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-hubble-700"
            >
              Menu
            </Link>
            <Link
              to="/events"
              className="inline-flex items-center justify-center bg-hubble-800/70 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white backdrop-blur-sm transition hover:bg-hubble-700"
            >
              Events
            </Link>
          </div>
        </div>
      </section>

      {/* Opening Times */}
      <section className="rounded-2xl bg-white px-6 py-10 text-hubble-900 shadow-lg shadow-hubble-950/20 md:px-12">
        <h2 className="text-center font-title text-2xl font-bold text-hubble-700 md:text-3xl">
          Opening Times
        </h2>
        {!hoursLoaded && (
          <p className="mt-6 text-center text-sm text-hubble-700/50">Loading…</p>
        )}
        {hoursLoaded && hours.length === 0 && (
          <p className="mt-6 text-center text-sm text-hubble-700/50">Opening times coming soon.</p>
        )}
        {hoursLoaded && hours.length > 0 && (
          <dl className="mx-auto mt-6 max-w-xl text-sm">
            {grouped.map(({ label, open, close }) => (
              <div key={label} className="flex items-center justify-between border-b border-hubble-50 py-2">
                <dt className="font-semibold text-hubble-700">{label}</dt>
                <dd className="text-hubble-800/80">{open} – {close}</dd>
              </div>
            ))}
            {allDays.filter((d) => !d.slot).map(({ day }) => (
              <div key={day} className="flex items-center justify-between border-b border-hubble-50 py-2">
                <dt className="font-semibold text-hubble-700">{DAY_LABELS[day]}</dt>
                <dd className="text-hubble-800/80">Closed</dd>
              </div>
            ))}
            {hasKitchen && groupKitchenHours(hours).map(({ label, open, close }) => (
              <div key={label} className="flex items-center justify-between border-b border-hubble-50 py-2">
                <dt className="font-semibold text-hubble-700">{label}</dt>
                <dd className="text-hubble-800/80">{open} – {close}</dd>
              </div>
            ))}
            {overrides.length > 0 && (
              <>
                <p className="pt-4 text-xs font-semibold uppercase tracking-widest text-hubble-500">
                  Special dates
                </p>
                {overrides.map((o) => (
                  <div key={o.id} className="flex items-start justify-between border-b border-hubble-50 py-2">
                    <dt className="font-semibold text-hubble-700">
                      {formatOverrideDate(o.date)}
                      {o.note && <span className="ml-2 text-xs font-normal text-hubble-500">({o.note})</span>}
                    </dt>
                    <dd className="shrink-0 text-hubble-800/80">
                      {o.closed ? 'Closed' : (o.open && o.close ? `${o.open} – ${o.close}` : 'Open')}
                    </dd>
                  </div>
                ))}
              </>
            )}
          </dl>
        )}
        <p className="mx-auto mt-5 max-w-xl text-center text-sm text-hubble-800/70">
          Looking to visit Hubble during the weekend? Fill out the reservation form to enquire about
          the options.
        </p>
      </section>

      {/* Features, each with a circular photo as on the live site. */}
      <section className="grid gap-6 md:grid-cols-3">
        {FEATURES.map(({ image, title, body }) => (
          <div
            key={title}
            className="rounded-2xl bg-white p-6 text-center text-hubble-900 shadow-lg shadow-hubble-950/20"
          >
            <img
              src={image}
              alt={title}
              loading="lazy"
              className="mx-auto h-40 w-40 rounded-full object-cover shadow-md"
            />
            <h3 className="mt-5 font-title text-lg font-bold uppercase text-hubble-700">{title}</h3>
            <p className="mt-2 text-sm text-hubble-800/80">{body}</p>
          </div>
        ))}
      </section>

      {/* Vision over the cafe interior photo. */}
      <section className="relative overflow-hidden rounded-2xl shadow-lg shadow-hubble-950/20">
        <img
          src="/images/vision.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-hubble-950/75" />
        <div className="relative grid gap-8 p-6 text-white md:grid-cols-2 md:p-10">
          <h2 className="font-title text-2xl font-bold leading-tight md:text-3xl">
            Run by students, welcoming everyone on the TU/e Campus
          </h2>
          <div className="space-y-3 text-sm text-hubble-50/90">
            <h3 className="font-title text-lg font-bold uppercase text-hubble-200">Our vision</h3>
            <p>
              A multi-functional bar as a meeting point for various groups, and a hub contributing to
              the liveliness of the campus. A quick breakfast for the rushed morning student, a coffee
              and a business meeting in the afternoon, a cheap and substantial meal for the
              hard-working student, and a place for a drink after activities at night.
            </p>
            <p>
              A stage for student associations and staff, a catered bar for scientific congresses,
              an international night for expats in the weekend, and a book reading on Sunday
              afternoon. All run by students, with professionals and volunteers from the associations.
            </p>
            <p>
              Hubble Community Cafe is a non-profit organisation that promotes the visibility and
              development of student culture on campus. Student associations connected to Hubble are
              supported with the profits of the enterprise.
            </p>
            <Link
              to="/community/board"
              className="inline-block pt-1 font-semibold text-hubble-200 hover:text-white"
            >
              Meet the community →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
