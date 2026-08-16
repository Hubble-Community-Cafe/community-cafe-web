import { usePageSeo } from '../lib/seo'

export function DiscountPolicyPage() {
  usePageSeo('Discount policy', 'How Meteor’s pricing works: discounts for TU/e students, campus residents and affiliated associations.')
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-title text-3xl font-bold uppercase tracking-tight text-meteor-900 md:text-4xl">
        Discount policy
      </h1>

      <div className="mt-6 space-y-7 text-meteor-800/90">
        <section>
          <p>
            Meteor Community Caf&eacute; is a non-profit organization with the goal to promote the
            visibility and development of student culture at the university campus by facilitating a
            bar/restaurant and providing financial aid to student associations in Eindhoven.
          </p>
          <p className="mt-2">
            Meteor Community Caf&eacute; is run by students for everyone. During the day staff members
            from Meteor provide the service and in the evening the bar is fully run by volunteers from
            affiliated associations. For this reason, food and drinks can be offered for affordable
            prices for these students.
          </p>
        </section>

        <section>
          <h2 className="font-title text-xl font-bold uppercase text-meteor-900">Discounts</h2>
          <p className="mt-2">
            Meteor holds a differentiation in price policy in which regular guests, TU/e students
            &amp; campus residents and association members are distinguished. Regular guests are able
            to choose from our friendly priced menu. TU/e students and residents from Haven, Luna and
            Aurora receive a 12.5% discount on drinks as they indirectly contribute to Meteor
            Community Caf&eacute;. Associations that are active within Meteor and contribute to the
            community receive up to 25% discount on drinks.
          </p>
          <p className="mt-2">
            The Meteor community makes the extensive opening hours and thus being the living room of
            the campus possible. By paying the regular price, regular guests make the financial
            support possible for the over 70 student associations that are part of the Meteor
            Community.
          </p>
        </section>

        <section>
          <h2 className="font-title text-xl font-bold uppercase text-meteor-900">
            Events &amp; group discount
          </h2>
          <p className="mt-2">
            Our discount policy is personal which means it cannot be applied for reservations with
            groups, as these reservations are more labour intensive and thus costly. Meteor does offer
            a discount of 12.5% on kegs of beer and bottles of wine if you are eligible to this
            discount usually.
          </p>
        </section>
      </div>
    </div>
  )
}
