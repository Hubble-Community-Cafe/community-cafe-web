import { useEffect, useState } from 'react'
import { getBoard, type BoardTerm, type BoardMember } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { usePageSeo } from '../lib/seo'

function useBoard() {
  const [terms, setTerms] = useState<BoardTerm[]>([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    getBoard()
      .then(setTerms)
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])
  return { terms, loaded }
}

// ── Current executive board ──────────────────────────────────────────────────

function MemberCard({ member }: { member: BoardMember }) {
  return (
    <div className="flex flex-col items-center border border-meteor-200 bg-white p-5 text-center">
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={member.photoAlt ?? member.name}
          loading="lazy"
          className="h-24 w-24 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-meteor-100 text-2xl font-bold text-meteor-400">
          {member.name.charAt(0).toUpperCase()}
        </div>
      )}
      <p className="mt-3 font-semibold uppercase tracking-wide text-meteor-800">{member.name}</p>
      {member.role && <p className="text-sm text-meteor-600/80">{member.role}</p>}
    </div>
  )
}

export function CurrentBoardPage() {
  usePageSeo('Board', 'The current board of Meteor Community Cafe.')
  const { terms, loaded } = useBoard()
  const term = terms.find((t) => t.type === 'EXECUTIVE' && t.current)

  return (
    <PageShell title="Current board">
      {!loaded && <p className="text-sm text-meteor-700/50">Loading…</p>}
      {loaded && (
        <>
          {term && term.members.length > 0 && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
                {term.members.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
              {term.photoCredit && (
                <p className="mt-4 text-sm text-meteor-600/60">{term.photoCredit}</p>
              )}
            </>
          )}
          {(!term || term.members.length === 0) && (
            <p className="mt-4 text-sm text-meteor-700/60">Board information coming soon.</p>
          )}
        </>
      )}
    </PageShell>
  )
}

// ── Previous boards ──────────────────────────────────────────────────────────

export function PreviousBoardsPage() {
  usePageSeo('Previous boards', 'Previous boards of Meteor Community Cafe.')
  const { terms, loaded } = useBoard()
  const previous = terms.filter(
    (t) => t.type === 'EXECUTIVE' && !t.current && (t.bar === 'METEOR' || t.bar === null),
  )

  return (
    <PageShell title="Previous boards">
      {!loaded && <p className="text-sm text-meteor-700/50">Loading…</p>}
      {loaded && previous.length === 0 && (
        <p className="text-sm text-meteor-700/60">No previous board information available.</p>
      )}
      {loaded && previous.map((term) => (
        <section key={term.id} className="mt-10 first:mt-6 text-center">
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-700">
            {term.label}
          </h2>
          <ul className="mt-3 space-y-1">
            {term.members.map((m) => (
              <li key={m.id} className="text-meteor-800">{m.name}</li>
            ))}
          </ul>
          {term.groupPhotoUrl && (
            <figure className="mt-6 flex flex-col items-center">
              <img
                src={term.groupPhotoUrl}
                alt={term.groupPhotoAlt ?? `${term.label} group photo`}
                loading="lazy"
                className="max-w-xl w-full object-cover"
              />
              {term.photoCredit && (
                <figcaption className="mt-2 text-sm text-meteor-600/60">{term.photoCredit}</figcaption>
              )}
            </figure>
          )}
          {!term.groupPhotoUrl && term.photoCredit && (
            <p className="mt-3 text-sm text-meteor-600/60">{term.photoCredit}</p>
          )}
        </section>
      ))}
    </PageShell>
  )
}

export { CurrentBoardPage as BoardPage }
