import { usePageSeo } from '../lib/seo'

export function PrivacyPage() {
  usePageSeo(
    'Privacy statement',
    'How Meteor Community Cafe handles your data: cookieless, no third-party tracking, and form messages kept only as email.',
  )
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-title text-3xl font-bold uppercase tracking-tight text-meteor-900 md:text-4xl">
        Privacy statement
      </h1>

      <div className="mt-6 space-y-7 text-meteor-800/90">
        <p>
          Meteor Community Caf&eacute; cares about your privacy. This site is built to collect as little as possible: it sets no cookies, uses no advertising or third-party tracking, and serves its fonts and images from our own server. This statement explains what personal data we do process, why, and what your rights are.
        </p>

        <section>
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-900">
            Who is responsible
          </h2>
          <p className="mt-2">
            Bubble Paviljoen B.V. (trading as Meteor), KvK 95363025, Blauwe loper 60, 5612 TA Eindhoven, is the controller for the personal data described here. For any privacy question or request, contact{' '}
            <a href="mailto:privacy@meteor.cafe" className="font-semibold underline">
              privacy@meteor.cafe
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-900">
            What we collect, and why
          </h2>
          <p className="mt-2">
            <strong>When you send us a message through a form.</strong> Our complaints and tips form asks for the details you choose to enter, typically your name, your email address, and your message. We use these only to read and answer you: the form is sent straight to the relevant volunteers as an email through Microsoft 365. We do not store your message or your details on this website, the only copy is that email in our mailbox. (We keep a minimal, non-identifying note that a submission happened, for spam and volume monitoring; it contains no name, email or message.) The form is protected against spam by a proof-of-work check and a hidden honeypot field; neither tracks you nor sets a cookie.
          </p>
          <p className="mt-2">
            <strong>When you visit the site.</strong> Our web server keeps standard access logs of each request, which include your IP address, the page requested, the date and time, the response status, and your browser and operating system. We use these logs, in aggregate, to see which pages are visited, to keep the site secure, and to fix problems, and we derive an approximate country and network operator from the IP address for statistics. We do not try to identify individual visitors. IP addresses in our analytics are kept for about 90 days and then dropped. There is no cookie, no tracking pixel and no third-party analytics service involved.
          </p>
          <p className="mt-2">
            <strong>If something goes wrong.</strong> When a technical error occurs, diagnostic details are sent to our error-monitoring provider, Sentry (sentry.io), so we can fix it. We configure it to avoid storing what you type into forms. This data may be processed outside the European Economic Area under appropriate safeguards.
          </p>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-900">
            Who we share data with
          </h2>
          <p className="mt-2">
            We do not sell your personal data. We share it only with the providers that help us run the site: Microsoft (Microsoft 365), to deliver the email a form generates; Sentry (sentry.io), for the error monitoring above; and our own hosting, on a server we manage.
          </p>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-900">
            Services we link to but do not run here
          </h2>
          <p className="mt-2">
            Our reservation system (harry.hubble.cafe) and the food order tracker (food.meteor.cafe) are separate applications. When you follow a link to them you leave this site and their own privacy handling applies; this statement does not cover them.
          </p>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-900">
            How long we keep your data
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Messages you send through the form: not stored on this website. The notification email in our staff mailbox is kept for up to two years, then deleted.
            </li>
            <li>Server access logs and analytics: about 90 days.</li>
            <li>Error logs: according to our provider&rsquo;s retention settings.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-900">
            Your rights
          </h2>
          <p className="mt-2">
            You have the right to ask us for a copy of the personal data we hold about you, to correct it, to have it deleted, to restrict or object to our use of it, and to receive it in a portable form, within the limits of the law. To exercise any of these, contact{' '}
            <a href="mailto:privacy@meteor.cafe" className="font-semibold underline">
              privacy@meteor.cafe
            </a>
            . You may also lodge a complaint with the Dutch data protection authority, the Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).
          </p>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-900">
            Security
          </h2>
          <p className="mt-2">
            The site is served over HTTPS. Forms are protected against automated abuse without tracking you, and access to the staff systems behind the site is restricted and logged.
          </p>
        </section>

        <section>
          <h2 className="font-title text-lg font-bold uppercase tracking-wide text-meteor-900">
            Changes to this statement
          </h2>
          <p className="mt-2">
            We may update this statement when the site changes. Last updated on 26 June 2026.
          </p>
        </section>
      </div>
    </div>
  )
}
