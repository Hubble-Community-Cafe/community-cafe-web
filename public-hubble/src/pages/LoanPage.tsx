import { useEffect, useState } from 'react'
import { submitLoan, FormError, formsChallengeUrl } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { AltchaWidget } from '../components/AltchaWidget'
import { usePageSeo } from '../lib/seo'

const field =
  'mt-1 w-full rounded-lg border border-hubble-200 bg-white px-3 py-2.5 text-sm text-hubble-900 ' +
  'outline-none transition focus:border-hubble-500 focus:ring-2 focus:ring-hubble-500/30'
const label = 'block text-sm font-semibold text-hubble-800'
const mail = 'font-semibold text-hubble-700 hover:underline'
// A reference looks like an inline link but opens the image in a modal instead of a new tab.
const ref =
  'cursor-pointer border-0 bg-transparent p-0 align-baseline font-semibold text-hubble-700 ' +
  'underline decoration-hubble-300 hover:decoration-hubble-600'

const RULES = [
  'Loaning equipment can only be done by associations connected to Hubble through a user contract. If your association is not connected to Hubble but you are interested in becoming connected, mention this in the message at the bottom of the form.',
  'Loaning equipment is always done through a loan agreement, which has to be signed with a board member of an association connected to Hubble.',
  'Picking up and bringing back equipment is in principle only possible during our opening times. If you really need an exception, mention this in the message at the bottom of the form.',
  'This is a request form, there are no obligations for you or us.',
  'If you do not know the exact pick-up time or time of bringing the equipment back, mention this in the message at the bottom of the form, and the moment you do know, send an email to loan@hubble.cafe.',
  'It is your own responsibility to arrange sufficient manpower to collect and return the items, especially the heavier ones. Hubble cannot guarantee that there are rolling containers available to move heavy things, nor is Hubble staff or board obligated to help with moving the equipment.',
]

export function LoanPage() {
  const [form, setForm] = useState({
    name: '', association: '', email: '',
    pickupDate: '', pickupTime: '', returnDate: '', returnTime: '', message: '', honeypot: '',
  })
  const [altcha, setAltcha] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null)
  usePageSeo('Loan Equipment', 'Connected associations can borrow tables, taps, speakers and more from Hubble.')

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // Let Escape close the image preview.
  useEffect(() => {
    if (!preview) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [preview])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      await submitLoan({ ...form, altcha: altcha ?? '' })
      setStatus('sent')
    } catch (err) {
      setError(err instanceof FormError ? err.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <PageShell title="Hubble Loan Equipment">
      <div className="mt-3 space-y-2 text-hubble-800/80">
        <p>
          Hubble has a lot of equipment that you, as a connected association, can borrow. To do so,
          please fill out the form below.
        </p>
        <p>
          If you have any questions you can send an email to{' '}
          <a href="mailto:loan@hubble.cafe" className={mail}>loan@hubble.cafe</a>.
        </p>
      </div>

      <section className="mt-6">
        <h2 className="font-title text-lg font-bold text-hubble-700">Rules for loaning from Hubble</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-hubble-800/90">
          {RULES.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-title text-lg font-bold text-hubble-700">List of equipment for loan</h2>
        <p className="mt-2 text-sm text-hubble-800/80">
          Be aware that the list below is a maximum indication; sometimes less is available.
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-hubble-800/90">
          <li>
            13x Cantus &ldquo;beer&rdquo; tables (with 26 benches) of varying widths (
            <button type="button" className={ref}
              onClick={() => setPreview({ src: '/images/loan/cantus-tables.jpeg', alt: 'Cantus tables' })}>
              cantus table
            </button>)
          </li>
          <li>13x Standing tables (with standing table covers)</li>
          <li>&gt;200x (a lot of) hard plastic cups (big and small)</li>
          <li>
            1x{' '}
            <button type="button" className={ref}
              onClick={() => setPreview({ src: '/images/loan/beer-draft.jpeg', alt: 'Electric cooled beer draft' })}>
              Electric cooled beer draft
            </button>
          </li>
          <li>
            2x{' '}
            <button type="button" className={ref}
              onClick={() => setPreview({ src: '/images/loan/ice-draft.jpeg', alt: 'Ice draft' })}>
              Ice drafts
            </button>
          </li>
          <li>
            1x Behringer speaker (
            <button type="button" className={ref}
              onClick={() => setPreview({ src: '/images/loan/behringer.jpeg', alt: 'Behringer Europort MPA200BT' })}>
              Behringer Europort MPA200BT
            </button>
            ) optionally with wireless microphone
          </li>
          <li>1x 6m x 3m party tent</li>
          <li>
            And a lot more! Thermos flasks, tools, etc. You can always ask the community manager (
            <a href="mailto:loan@hubble.cafe" className={mail}>loan@hubble.cafe</a>) whether Hubble
            has something you would like to loan.
          </li>
        </ul>
      </section>

      {status === 'sent' ? (
        <div className="mt-8 rounded-xl border border-hubble-100 bg-hubble-50 p-6">
          <h2 className="font-title text-xl font-bold text-hubble-700">Request received</h2>
          <p className="mt-2 text-sm text-hubble-800/80">
            Thanks! Your loan request has been sent to the community manager. This is a request, not
            a confirmed booking. A confirmation has been sent to your email address.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="l-name" className={label}>Name *</label>
              <input id="l-name" required value={form.name} onChange={set('name')} className={field} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="l-assoc" className={label}>Association *</label>
              <input id="l-assoc" required value={form.association} onChange={set('association')} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="l-email" className={label}>Email *</label>
              <input id="l-email" type="email" required value={form.email} onChange={set('email')} className={field} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="l-pdate" className={label}>Pick-up date *</label>
              <input id="l-pdate" type="date" required value={form.pickupDate} onChange={set('pickupDate')} className={field} />
            </div>
            <div>
              <label htmlFor="l-ptime" className={label}>Pick-up time *</label>
              <input id="l-ptime" type="time" required value={form.pickupTime} onChange={set('pickupTime')} className={field} />
            </div>
            <div>
              <label htmlFor="l-rdate" className={label}>Return date *</label>
              <input id="l-rdate" type="date" required value={form.returnDate} onChange={set('returnDate')} className={field} />
            </div>
            <div>
              <label htmlFor="l-rtime" className={label}>Return time *</label>
              <input id="l-rtime" type="time" required value={form.returnTime} onChange={set('returnTime')} className={field} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="l-message" className={label}>Message *</label>
              <textarea id="l-message" required rows={5} value={form.message} onChange={set('message')} className={field}
                placeholder="What you would like to borrow, and anything we should know." />
            </div>
          </div>

          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website"
            value={form.honeypot} onChange={set('honeypot')} className="hidden" />

          <div className="pb-2">
            <AltchaWidget challengeUrl={formsChallengeUrl()} onVerified={setAltcha} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>
          )}

          <button type="submit" disabled={status === 'sending'}
            className="rounded-lg bg-hubble-700 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-hubble-600 disabled:opacity-60">
            {status === 'sending' ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}

      {preview && (
        <div
          role="dialog" aria-modal="true" aria-label={preview.alt}
          onClick={() => setPreview(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <figure className="relative max-h-[90vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button" onClick={() => setPreview(null)} aria-label="Close"
              className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-0.5 text-xl font-bold leading-none text-hubble-900 shadow hover:bg-white"
            >
              &times;
            </button>
            <img src={preview.src} alt={preview.alt} className="max-h-[85vh] w-auto rounded-lg" />
            <figcaption className="mt-2 text-center text-sm text-white/90">{preview.alt}</figcaption>
          </figure>
        </div>
      )}
    </PageShell>
  )
}
