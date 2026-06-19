import { useEffect, useState } from 'react'
import { getBoard, type BoardTerm, type BoardMember } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'

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
    <div>
      {member.photoUrl ? (
        <img
          src={member.photoUrl}
          alt={member.photoAlt ?? member.name}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center bg-hubble-100 text-4xl font-bold text-hubble-300">
          {member.name.charAt(0).toUpperCase()}
        </div>
      )}
      <p className="mt-3 text-base font-bold text-hubble-800">{member.name}</p>
      {member.role && <p className="mt-0.5 text-sm italic text-hubble-600">{member.role}</p>}
    </div>
  )
}

export function CurrentBoardPage() {
  const { terms, loaded } = useBoard()
  const term = terms.find((t) => t.type === 'EXECUTIVE' && t.current)

  return (
    <PageShell title="Board">
      {!loaded && <p className="text-sm text-hubble-700/50">Loading…</p>}
      {loaded && (
        <>
          <p className="text-hubble-800">
            Hubble is fully powered by a group of students dedicating their time into building
            the community and cafe we all know and love. The illustrious board of Hubble
            Community Cafe currently consists of:
          </p>

          {term && term.members.length > 0 && (
            <>
              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
                {term.members.map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>
              {term.photoCredit && (
                <p className="mt-6 text-sm text-hubble-600/70">{term.photoCredit}</p>
              )}
            </>
          )}

          {(!term || term.members.length === 0) && (
            <p className="mt-4 text-sm text-hubble-700/60">Board information coming soon.</p>
          )}
        </>
      )}
    </PageShell>
  )
}

// ── Previous boards ──────────────────────────────────────────────────────────

export function PreviousBoardsPage() {
  const { terms, loaded } = useBoard()
  const previous = terms.filter(
    (t) => t.type === 'EXECUTIVE' && !t.current && (t.bar === 'HUBBLE' || t.bar === null),
  )

  return (
    <PageShell title="Previous boards">
      {!loaded && <p className="text-sm text-hubble-700/50">Loading…</p>}
      {loaded && previous.length === 0 && (
        <p className="text-sm text-hubble-700/60">No previous board information available.</p>
      )}
      {loaded && previous.map((term) => (
        <section key={term.id} className="mt-10 first:mt-6">
          <h2 className="font-title text-xl font-bold text-hubble-800">{term.label}</h2>
          <ul className="mt-3 space-y-1">
            {term.members.map((m) => (
              <li key={m.id} className="text-hubble-700">{m.name}</li>
            ))}
          </ul>
          {term.groupPhotoUrl && (
            <figure className="mt-6">
              <img
                src={term.groupPhotoUrl}
                alt={term.groupPhotoAlt ?? `${term.label} group photo`}
                loading="lazy"
                className="w-full max-w-2xl object-cover"
              />
              {term.photoCredit && (
                <figcaption className="mt-2 text-sm text-hubble-600/70">{term.photoCredit}</figcaption>
              )}
            </figure>
          )}
          {!term.groupPhotoUrl && term.photoCredit && (
            <p className="mt-3 text-sm text-hubble-600/70">{term.photoCredit}</p>
          )}
        </section>
      ))}
    </PageShell>
  )
}

// ── Supervisory board ────────────────────────────────────────────────────────

export function SupervisoryBoardPage() {
  const { terms, loaded } = useBoard()
  const supervisory = terms.filter((t) => t.type === 'SUPERVISORY')

  return (
    <PageShell title="The supervisory board of Hubble">
      {!loaded && <p className="text-sm text-hubble-700/50">Loading…</p>}
      {loaded && supervisory.map((term) => (
        <section key={term.id} className="mt-6">
          <p className="text-hubble-800">Currently consisting of:</p>
          <ul className="mt-4 list-disc space-y-1 pl-5">
            {term.members.map((m) => (
              <li key={m.id} className="text-hubble-800">
                {m.name}{m.role ? ` (${m.role})` : ''}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {loaded && supervisory.length === 0 && (
        <p className="mt-4 text-sm text-hubble-700/60">Supervisory board information coming soon.</p>
      )}
    </PageShell>
  )
}
