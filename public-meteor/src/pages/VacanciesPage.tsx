import { useEffect, useState } from 'react'
import { getVacancies, reportApiFailure, type Vacancy } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { usePageSeo } from '../lib/seo'

const applyClass =
  'mt-4 inline-block bg-meteor-700 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-meteor-500'

function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  return (
    <article className="border border-meteor-200 bg-white p-5">
      <h3 className="font-title text-lg font-bold uppercase text-meteor-700">{vacancy.title}</h3>
      {vacancy.description && (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-meteor-900/80">{vacancy.description}</p>
      )}
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-meteor-700">
        {vacancy.hours && (
          <div><dt className="inline font-semibold">Hours: </dt><dd className="inline">{vacancy.hours}</dd></div>
        )}
        {vacancy.type && (
          <div><dt className="inline font-semibold">Type: </dt><dd className="inline">{vacancy.type}</dd></div>
        )}
      </dl>
      {vacancy.applyLink ? (
        <a href={vacancy.applyLink} target="_blank" rel="noopener noreferrer" className={applyClass}>
          Apply
        </a>
      ) : vacancy.applyEmail ? (
        <a href={`mailto:${vacancy.applyEmail}`} className={applyClass}>
          Apply
        </a>
      ) : null}
    </article>
  )
}

export function VacanciesPage() {
  usePageSeo('Vacancies', 'Open positions at Meteor Community Cafe.')
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    getVacancies('METEOR')
      .then(setVacancies)
      .catch((err: unknown) => {
        void reportApiFailure('vacancies', err)
        setError(true)
      })
      .finally(() => setLoaded(true))
  }, [])

  return (
    <PageShell title="Vacancies">
      <p className="mt-3 max-w-2xl text-meteor-800/90">
        Meteor Community Caf&eacute; is a non-profit bar and restaurant on the TU/e campus, run by
        students for everyone. Want to be part of the team? The open positions are listed below.
      </p>

      <h2 className="mt-10 font-title text-xl font-bold uppercase text-meteor-900">Open positions</h2>
      {!loaded && (
        <p className="mt-4 text-sm text-meteor-700/70">Loading…</p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-700">Could not load the open positions. Please try again later.</p>
      )}
      {loaded && !error && vacancies.length === 0 && (
        <p className="mt-4 text-sm text-meteor-700/70">No open positions at the moment. Check back soon!</p>
      )}
      {loaded && vacancies.length > 0 && (
        <div className="mt-4 space-y-4">
          {vacancies.map((v) => (
            <VacancyCard key={v.id} vacancy={v} />
          ))}
        </div>
      )}
    </PageShell>
  )
}
