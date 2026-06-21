import { PageShell } from '../components/PageShell'

const COMMITTEES: { name: string; img: string }[] = [
  { name: 'IntroDuckCie', img: '/images/committees/introduckcie.jpg' },
  { name: 'Botch Ducks', img: '/images/committees/botch-ducks.webp' },
  { name: 'Cocktail Committee', img: '/images/committees/cocktail.jpg' },
  { name: 'ActCie', img: '/images/committees/actcie.jpg' },
  { name: 'Ducktales', img: '/images/committees/ducktales.jpg' },
  { name: 'Dagobert DuckCie', img: '/images/committees/dagobert.jpg' },
]

export function CommitteesPage() {
  return (
    <PageShell title="Committees">
      <figure className="mt-5 overflow-hidden rounded-xl">
        <img src="/images/committees/hero.jpg" alt="A Hubble committee at work."
          loading="lazy" className="h-48 w-full object-cover md:h-64" />
      </figure>

      <section className="mt-6">
        <h2 className="font-title text-lg font-bold text-hubble-700">
          Building the best bar in the universe
        </h2>
        <p className="mt-2 text-hubble-800/90">
          And learn a couple of things too. Our committees are formed by enthusiastic students from
          all over the campus. In multidisciplinary teams we bundle our creativity to make and improve
          ideas, with a clear goal towards improving student life in Eindhoven. Hubble provides unique
          opportunities to make the impossible possible. Are you interested in our committees? Ask
          your favourite board member for more information or simply send us an email.
        </p>
      </section>

      <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {COMMITTEES.map((c) => (
          <li key={c.name} className="overflow-hidden rounded-xl border border-hubble-100 bg-white">
            <img src={c.img} alt={c.name} loading="lazy" className="aspect-square w-full object-cover" />
            <p className="px-3 py-2 text-center text-sm font-semibold text-hubble-800">{c.name}</p>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
