import { ExternalLink } from 'lucide-react'
import { getUpcomingEvents, reportApiFailure, type CafeEvent, useApiResource, LoadingSkeleton } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { Shimmer } from '../components/Shimmer'
import { usePageSeo } from '../lib/seo'

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
        <h2 className="mt-2 font-title text-lg font-bold text-hubble-800">{event.title}</h2>
        {event.price && (
          <p className="mt-1 text-sm font-medium text-hubble-600">{event.price}</p>
        )}
        {event.description && (
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-hubble-700/80">{event.description}</p>
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

/** Placeholder cards in the shape of the event cards while they load. */
function EventsSkeleton() {
  return (
    <LoadingSkeleton className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" testId="events-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-md shadow-hubble-950/10">
          <Shimmer className="h-52 w-full rounded-none" />
          <div className="space-y-2 p-5">
            <Shimmer className="h-3 w-40" />
            <Shimmer className="h-5 w-3/4" />
            <Shimmer className="h-3 w-full" />
            <Shimmer className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </LoadingSkeleton>
  )
}

export function EventsPage() {
  usePageSeo('Events', 'Upcoming events at Hubble Community Cafe: parties, lectures, drinks and more.')
  const { data: events, loaded, error } = useApiResource<CafeEvent[]>(
    () => getUpcomingEvents('HUBBLE'), [],
    (err) => void reportApiFailure('events', err),
  )

  return (
    <PageShell title="Events">
      {!loaded && <EventsSkeleton />}
      {error && (
        <p role="alert" className="text-sm text-red-600">Could not load the events. Please try again later.</p>
      )}
      {loaded && !error && events.length === 0 && (
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
