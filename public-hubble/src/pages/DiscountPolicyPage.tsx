import { PageShell } from '../components/PageShell'
import { usePageSeo } from '../lib/seo'

export function DiscountPolicyPage() {
  usePageSeo('Discount policy', 'How Hubble’s pricing works: discounts for TU/e students, campus residents and affiliated associations.')
  return (
    <PageShell title="Discount policy">
      <figure className="mt-5 overflow-hidden rounded-xl">
        <img src="/images/discount-money-duck.jpg"
          alt="A duck guarding a pile of coins, Hubble's discount-policy mascot."
          loading="lazy" className="h-48 w-full object-cover md:h-60" />
      </figure>

      <div className="mt-6 space-y-7 text-hubble-800/90">
        <section>
          <h2 className="font-title text-lg font-bold text-hubble-700">Paying less for more beer</h2>
          <p className="mt-2">
            Hubble Community Caf&eacute; is a non-profit organization with the goal to promote the
            visibility and development of student culture at the university campus by facilitating a
            bar/restaurant and providing financial aid to student associations in Eindhoven.
          </p>
          <p className="mt-2">
            Hubble Community Caf&eacute; is run by students for everyone. During the day staff members
            from Hubble provide the service and in the evening the bar is fully run by volunteers from
            affiliated associations. For this reason, food and drinks can be offered for affordable
            prices for these students.
          </p>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold text-hubble-700">Discounts</h2>
          <p className="mt-2">
            Hubble holds a differentiation in price policy in which regular guests, TU/e students
            &amp; campus residents and association members are distinguished. Regular guests are able
            to choose from our friendly priced menu. TU/e students and residents from Luna &amp; Aurora
            receive a 12.5% discount on drinks as they indirectly contribute to Hubble Community
            Caf&eacute;. Associations that are active within Hubble and contribute to the community
            receive up to 25% discount on drinks.
          </p>
          <p className="mt-2">
            The Hubble community makes the extensive opening hours and thus being the living room of
            the campus possible. By paying the regular price, regular guests make the financial
            support possible for the over 70 student associations that are part of the Hubble
            Community.
          </p>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold text-hubble-700">Events &amp; group discount</h2>
          <p className="mt-2">
            Our discount policy is personal which means it cannot be applied for reservations with
            groups, as these reservations are more labour intensive and thus costly. Hubble does offer
            a discount of 12.5% on kegs of beer and bottles of wine if you are eligible to this
            discount usually.
          </p>
        </section>
      </div>
    </PageShell>
  )
}
