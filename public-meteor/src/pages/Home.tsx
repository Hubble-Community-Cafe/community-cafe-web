import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { EXTERNAL } from '../navigation'

export function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-meteor-50">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h1 className="max-w-3xl font-title text-4xl font-bold uppercase leading-tight text-meteor-500 md:text-6xl">
            Welcome to Meteor
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-meteor-900/80">
            Meteor is a lively cafe and meeting space by day, where people work and connect over
            coffee. By night, it transforms into a relaxed, inclusive spot for events and gatherings.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={EXTERNAL.foodTracker}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-meteor-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-meteor-600"
            >
              Food Tracker
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href={EXTERNAL.reservations}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-meteor-accent px-5 py-3 text-sm font-bold uppercase tracking-wide text-meteor-950 transition hover:brightness-110"
            >
              Reservations
              <ExternalLink className="h-4 w-4" />
            </a>
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 border border-meteor-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-meteor-700 transition hover:bg-meteor-100"
            >
              Menu
            </Link>
          </div>
        </div>
        {/* The signature day/night bears banner. */}
        <img
          src="/images/banner.webp"
          alt="Meteor by day and by night: working over coffee, celebrating at events"
          className="block w-full"
        />
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-16">
        {/* Opening hours */}
        <section>
          <h2 className="font-title text-2xl font-bold uppercase text-meteor-500 md:text-3xl">
            Opening hours
          </h2>
          <dl className="mt-6 max-w-2xl divide-y divide-meteor-100 border-y border-meteor-100">
            <div className="flex items-center justify-between py-3">
              <dt className="font-bold uppercase tracking-wide text-meteor-700">Monday to Friday</dt>
              <dd className="text-meteor-900/80">16:00 to 02:00</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="font-bold uppercase tracking-wide text-meteor-700">
                Saturday to Sunday
              </dt>
              <dd className="text-meteor-900/80">Closed</dd>
            </div>
          </dl>
          <h3 className="mt-6 font-title text-lg font-bold uppercase text-meteor-500">
            Alternative hours
          </h3>
          <p className="mt-1 text-sm italic text-meteor-text">
            We are always willing to discuss opening at other times for a reservation.
          </p>
        </section>

        {/* About us, with the day interior photo. */}
        <section className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-title text-2xl font-bold uppercase text-meteor-500 md:text-3xl">
              About us
            </h2>
            <p className="mt-4 text-meteor-900/80">
              Meteor is more than just a cafe; it is a vibrant meeting point and living lab in the
              heart of Haven. By day, it is a professional yet welcoming space where students,
              researchers, residents, and entrepreneurs come together or work on their own over
              coffee and a small bite. By night, it becomes the living room of Haven: a relaxed,
              inclusive space for informal gatherings, cultural events, and connections.
            </p>
            <p className="mt-4 text-meteor-900/80">
              As a multifunctional hub, Meteor hosts business meetups, workshops, community dinners,
              and resident-led initiatives. It is a stage for new ideas, a testing ground for
              innovation, and a home for meaningful conversations. From pitch nights to poetry
              readings, from prototype launches to international evenings: Meteor brings diverse
              worlds together under one roof.
            </p>
          </div>
          <img
            src="/images/about-day.webp"
            alt="Meteor's cafe interior by day"
            loading="lazy"
            className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lg"
          />
        </section>

        {/* Mission, with the night interior photo. */}
        <section className="grid items-center gap-8 md:grid-cols-2">
          <img
            src="/images/about-night.webp"
            alt="Meteor's cafe interior by night, lit in blue"
            loading="lazy"
            className="order-2 aspect-[4/5] w-full rounded-2xl object-cover shadow-lg md:order-1"
          />
          <p className="order-1 font-title text-2xl font-bold uppercase leading-snug text-meteor-500 md:order-2 md:text-3xl">
            Run collaboratively by residents, students, and local partners, Meteor operates as a
            non-profit. All proceeds are reinvested into local innovation, education, and
            community-building initiatives, fueling the TU/e campus student life.
          </p>
        </section>
      </div>
    </>
  )
}
