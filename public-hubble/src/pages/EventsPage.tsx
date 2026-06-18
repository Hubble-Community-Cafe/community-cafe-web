import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { getUpcomingEvents, type CafeEvent } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'

function formatEventDate(dateStr: string, startTime: string | null): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const label = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  return startTime ? `${label}, ${startTime}` : label
}

function EventCard({ event }: { event: CafeEvent }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-md shadow-hubble-950/10">
      {event.imageUrl && (
        <img
          src={event.imageUrl}
          alt={event.imageAlt ?? event.title}
          loading="lazy"
          className="h-52 w-full object-cover"
        />
      )}
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-hubble-500">
          {formatEventDate(event.date, event.startTime)}
        </p>
        <h3 className="mt-2 font-title text-lg font-bold text-hubble-800">{event.title}</h3>
        {event.price && (
          <p className="mt-1 text-sm font-medium text-hubble-600">{event.price}</p>
        )}
        {event.description && (
          <p className="mt-2 text-sm leading-relaxed text-hubble-700/80">{event.description}</p>
        )}
        {event.subscribeLink && (
          <a
            href={event.subscribeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-hubble-700 hover:text-hubble-500"
          >
            Sign up <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  )
}

export function EventsPage() {
  const [events, setEvents] = useState<CafeEvent[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getUpcomingEvents('HUBBLE')
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <PageShell title="Events">
      {!loaded && (
        <p className="text-sm text-hubble-700/50">Loading…</p>
      )}
      {loaded && events.length === 0 && (
        <p className="text-sm text-hubble-700/70">No upcoming events at the moment. Check back soon!</p>
      )}
      {loaded && events.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
