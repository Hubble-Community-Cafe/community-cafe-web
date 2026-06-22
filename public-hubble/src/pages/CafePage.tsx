import { PageShell } from '../components/PageShell'
import { usePageSeo } from '../lib/seo'

export function CafePage() {
  usePageSeo('The Cafe', 'Hubble is the living room of the TU/e campus: food, drinks and events, open to everyone.')
  return (
    <PageShell title="Living room of the Campus">
      <div className="mt-4 space-y-4 text-hubble-800/90">
        <p>
          Established in the Luna building, located in the center of the TU/e campus, Hubble is the
          beating heart of the university. A place where networks are built and friends are made, all
          while enjoying a wide selection of drinks paired with good and competitively priced food.
        </p>
        <p>
          A lot of events take place during both day and nighttime. In principle, everything is
          possible. Company lectures, graduation celebrations, network drinks and association parties
          all form part of what makes Hubble open to everyone.
        </p>
      </div>
    </PageShell>
  )
}
