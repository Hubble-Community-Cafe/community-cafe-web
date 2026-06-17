import { Link } from 'react-router-dom'
import { CalendarDays, ExternalLink, UtensilsCrossed } from 'lucide-react'
import { EXTERNAL } from '../navigation'

export function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-hubble-700 via-hubble-600 to-hubble-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="font-title text-sm uppercase tracking-widest text-hubble-200">
            TU/e Campus
          </p>
          <h1 className="mt-3 max-w-3xl font-title text-4xl font-bold leading-tight md:text-6xl">
            Welcome to Hubble Community Cafe
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-hubble-50/90">
            A lively place to eat, drink, and meet on campus. Enjoy our floating gold in the
            sunshine, join an event, or book the cafe for your association.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={EXTERNAL.reservations}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-hubble-700 shadow-lg shadow-hubble-900/20 transition hover:bg-hubble-50"
            >
              Make a reservation
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={EXTERNAL.foodTracker}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Food tracker
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              to="/cafe/menu"
              className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            to="/cafe/menu"
            className="group rounded-2xl border border-hubble-100 bg-white p-6 shadow-sm transition hover:border-hubble-300 hover:shadow-md"
          >
            <UtensilsCrossed className="h-8 w-8 text-hubble-500" />
            <h2 className="mt-4 font-title text-xl font-bold text-hubble-700">Menu &amp; daily dish</h2>
            <p className="mt-2 text-sm text-hubble-800/80">
              See what's on, including the daily dinner dish and TU/e student pricing.
            </p>
          </Link>
          <Link
            to="/events"
            className="group rounded-2xl border border-hubble-100 bg-white p-6 shadow-sm transition hover:border-hubble-300 hover:shadow-md"
          >
            <CalendarDays className="h-8 w-8 text-hubble-500" />
            <h2 className="mt-4 font-title text-xl font-bold text-hubble-700">Events</h2>
            <p className="mt-2 text-sm text-hubble-800/80">
              Drinks, socials, and association nights happening at Hubble.
            </p>
          </Link>
          <Link
            to="/community/board"
            className="group rounded-2xl border border-hubble-100 bg-white p-6 shadow-sm transition hover:border-hubble-300 hover:shadow-md"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-hubble-500 font-title text-sm font-bold text-white">
              H
            </span>
            <h2 className="mt-4 font-title text-xl font-bold text-hubble-700">Community</h2>
            <p className="mt-2 text-sm text-hubble-800/80">
              Meet the board, the committees, and the associations behind the cafe.
            </p>
          </Link>
        </div>
      </section>
    </>
  )
}
