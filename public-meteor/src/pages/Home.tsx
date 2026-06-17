import { Link } from 'react-router-dom'
import { CalendarDays, ExternalLink, UtensilsCrossed } from 'lucide-react'
import { EXTERNAL } from '../navigation'

export function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-meteor-500 via-meteor-600 to-meteor-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <p className="font-title text-sm uppercase tracking-widest text-meteor-accent">
            Eindhoven
          </p>
          <h1 className="mt-3 max-w-3xl font-title text-4xl font-bold leading-tight md:text-6xl">
            Welcome to Meteor
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-meteor-50/90">
            A lively cafe and meeting space by day, where people work and connect over coffee. By
            night, a relaxed, inclusive spot for events and gatherings.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={EXTERNAL.reservations}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-meteor-accent px-5 py-3 text-sm font-semibold text-meteor-950 shadow-lg shadow-meteor-950/30 transition hover:brightness-110"
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
              to="/menu"
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
            to="/menu"
            className="group rounded-2xl border border-meteor-100 bg-white p-6 shadow-sm transition hover:border-meteor-300 hover:shadow-md"
          >
            <UtensilsCrossed className="h-8 w-8 text-meteor-400" />
            <h2 className="mt-4 font-title text-xl font-bold text-meteor-500">Menu</h2>
            <p className="mt-2 text-sm text-meteor-800/80">
              Coffee, drinks, and food, with TU/e student pricing and our discount policy.
            </p>
          </Link>
          <Link
            to="/agenda"
            className="group rounded-2xl border border-meteor-100 bg-white p-6 shadow-sm transition hover:border-meteor-300 hover:shadow-md"
          >
            <CalendarDays className="h-8 w-8 text-meteor-400" />
            <h2 className="mt-4 font-title text-xl font-bold text-meteor-500">Agenda</h2>
            <p className="mt-2 text-sm text-meteor-800/80">
              What's on at Meteor: events, gatherings, and evening programming.
            </p>
          </Link>
          <Link
            to="/community/board"
            className="group rounded-2xl border border-meteor-100 bg-white p-6 shadow-sm transition hover:border-meteor-300 hover:shadow-md"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-meteor-500 font-title text-sm font-bold text-meteor-accent">
              M
            </span>
            <h2 className="mt-4 font-title text-xl font-bold text-meteor-500">Community</h2>
            <p className="mt-2 text-sm text-meteor-800/80">
              Meet the board and the people who keep Meteor running.
            </p>
          </Link>
        </div>
      </section>
    </>
  )
}
