import { useEffect, useState } from 'react'
import { getAssociations, type Association } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { usePageSeo } from '../lib/seo'

export function AssociationsPage() {
  usePageSeo('Associations', 'The student associations that are part of the Hubble community.')
  const [associations, setAssociations] = useState<Association[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAssociations('HUBBLE')
      .then(setAssociations)
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <PageShell
      title="Associations"
      intro="Hubble is home to many student associations that were formerly resident in the Bunker. We provide a place for like-minded people to connect, organise events, and enjoy campus life together."
    >
      {!loaded && (
        <p className="mt-8 text-sm text-hubble-500">Loading associations…</p>
      )}

      {loaded && associations.length === 0 && (
        <p className="mt-8 text-sm text-hubble-500">No associations listed yet.</p>
      )}

      {loaded && associations.length > 0 && (
        <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
          {associations.map((a) => (
            <li key={a.id} className="flex flex-col items-center gap-3">
              {a.logoUrl ? (
                <div className="flex h-24 w-full items-center justify-center rounded-xl border border-hubble-100 bg-hubble-50 p-3">
                  <img
                    src={a.logoUrl}
                    alt={a.logoAlt ?? a.name}
                    className="max-h-16 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-full items-center justify-center rounded-xl border border-hubble-100 bg-hubble-50">
                  <span className="font-title text-2xl font-bold text-hubble-300">
                    {a.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-center text-sm font-semibold text-hubble-800">{a.name}</p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  )
}
