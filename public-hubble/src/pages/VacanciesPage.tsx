import { useEffect, useState } from 'react'
import { getVacancies, type Vacancy } from '@cafe/shared-web'
import { usePageSeo } from '../lib/seo'

const TEAM_PHOTOS = [
  { src: '/images/josselyn.jpg', alt: 'Manager' },
  { src: '/images/team-1.jpg',   alt: 'Team impression' },
  { src: '/images/team-8.jpg',   alt: 'Team impression' },
  { src: '/images/team-16.jpg',  alt: 'Team impression' },
]

function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  return (
    <div className="rounded-xl border border-hubble-100 bg-hubble-50 px-5 py-4">
      <h3 className="font-title text-lg font-bold text-hubble-700">{vacancy.title}</h3>
      {vacancy.description && (
        <p className="mt-2 text-sm leading-relaxed text-hubble-800/80">{vacancy.description}</p>
      )}
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-hubble-600">
        {vacancy.hours && (
          <div><dt className="inline font-semibold">Hours: </dt><dd className="inline">{vacancy.hours}</dd></div>
        )}
        {vacancy.type && (
          <div><dt className="inline font-semibold">Type: </dt><dd className="inline">{vacancy.type}</dd></div>
        )}
      </dl>
      {vacancy.applyLink ? (
        <a
          href={vacancy.applyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded bg-hubble-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600"
        >
          Apply
        </a>
      ) : vacancy.applyEmail ? (
        <a
          href={`mailto:${vacancy.applyEmail}`}
          className="mt-4 inline-block rounded bg-hubble-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-hubble-600"
        >
          Apply
        </a>
      ) : null}
    </div>
  )
}

export function VacanciesPage() {
  usePageSeo('Vacancies', 'Open positions and volunteer roles at Hubble Community Cafe.')
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getVacancies('HUBBLE')
      .then(setVacancies)
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <section className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-hubble-950/20">
        {/* Hero */}
        <div className="relative flex min-h-56 items-center justify-center bg-hubble-800 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/vacancies-hero.jpg)' }}>
          <div className="absolute inset-0 bg-hubble-900/55" />
          <div className="relative z-10 px-6 py-10 text-center">
            <h1 className="font-title text-4xl font-bold tracking-tight text-white drop-shadow md:text-5xl">
              Vacancies
            </h1>
            <p className="mt-2 text-base text-white/80">
              Are you looking for the perfect part-time job?
            </p>
          </div>
        </div>

        <div className="px-6 py-10 md:px-12">
          <h2 className="font-title text-2xl font-bold text-hubble-700">
            Working in a large community!
          </h2>
          <p className="mt-4 text-hubble-800/90">
            We're Hubble Community Cafe, an enthusiastic group of people running the most wonderful
            bar run on a lively campus in Eindhoven. We're open for breakfast, lunch, dinner, drinks,
            and many events. We aim to connect people and create a community with a place for everyone.
            We do this by running a bar with a smile on our faces.
          </p>
          <p className="mt-4 text-hubble-800/90">
            Any positions to apply for can be found below, but in general you can always reach out. Especially if you are motivated
            and eager to work here, do not hesitate to send your CV to{' '}
            <a href="mailto:jobs@hubble.cafe" className="text-hubble-600 underline hover:text-hubble-500">
              jobs@hubble.cafe
            </a>{' '}
            and we can reach out to you once we need new people. Hubble is also working on opening a
            second bar on campus, which will require staff, so if this interests you, we would love
            to hear from you! Hubble is a flexible employer, and almost anything is possible.
            We're eager to meet you!
          </p>

          {/* Team impression photos */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {TEAM_PHOTOS.map((photo) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            ))}
          </div>

          {/* Vacancy listings */}
          {!loaded && (
            <p className="mt-10 text-sm text-hubble-700/50">Loading…</p>
          )}
          {loaded && vacancies.length > 0 && (
            <div className="mt-10 space-y-4">
              <h2 className="font-title text-xl font-bold text-hubble-700">Open positions</h2>
              {vacancies.map((v) => (
                <VacancyCard key={v.id} vacancy={v} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
