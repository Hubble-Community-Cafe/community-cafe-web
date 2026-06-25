import { useEffect, useState } from 'react'
import { getBoard, type BoardTerm, type BoardMember } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { Shimmer } from '../components/Shimmer'
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

/** Placeholder grid mirroring the member cards while the board loads. */
function BoardGridSkeleton() {
  return (
    <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3" data-testid="board-skeleton">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center border border-meteor-200 bg-white p-5">
          <Shimmer className="h-24 w-24 rounded-full" />
          <Shimmer className="mt-3 h-4 w-24" />
          <Shimmer className="mt-1.5 h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

/** A few shimmer lines for the text-only previous-boards page. */
function BoardLinesSkeleton() {
  return (
    <div className="mt-6 space-y-2 text-center" data-testid="board-skeleton">
      <Shimmer className="mx-auto h-5 w-40" />
      <Shimmer className="mx-auto h-3 w-32" />
      <Shimmer className="mx-auto h-3 w-28" />
    </div>
  )
}

// ── Current executive board ──────────────────────────────────────────────────

function MemberCard({ member, index }: { member: BoardMember; index: number }) {
  return (
    <div
      className="flex animate-fade-up flex-col items-center border border-meteor-200 bg-white p-5 text-center"
      style={{ animationDelay: `${Math.min(index * 0.07, 0.5)}s` }}
    >
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
      {!loaded && <BoardGridSkeleton />}
      {loaded && (
        <>
          {term && term.members.length > 0 && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
                {term.members.map((m, i) => (
                  <MemberCard key={m.id} member={m} index={i} />
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
      {!loaded && <BoardLinesSkeleton />}
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
