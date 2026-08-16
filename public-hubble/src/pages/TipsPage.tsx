import { useState } from 'react'
import { submitTip, FormError, formsChallengeUrl, type ComplaintType } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { AltchaWidget } from '../components/AltchaWidget'
import { usePageSeo } from '../lib/seo'

const TYPES: { value: ComplaintType; label: string }[] = [
  { value: 'TIP', label: 'Tip' },
  { value: 'COMPLAINT', label: 'Complaint' },
  { value: 'IDEA', label: 'Idea' },
]

const field =
  'mt-1 w-full rounded-lg border border-hubble-200 bg-white px-3 py-2.5 text-sm text-hubble-900 ' +
  'outline-none transition focus-visible:border-hubble-500 focus-visible:ring-2 focus-visible:ring-hubble-500/30'
const label = 'block text-sm font-semibold text-hubble-800'

export function TipsPage() {
  usePageSeo('Tips, Complaints & Ideas', 'Share a tip, raise a complaint or suggest an idea for Hubble Community Cafe.')
  const [form, setForm] = useState({
    name: '', email: '', phone: '', date: '', message: '', honeypot: '',
  })
  const [type, setType] = useState<ComplaintType>('TIP')
  const [wantsUpdates, setWantsUpdates] = useState(true)
  const [altcha, setAltcha] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      await submitTip({
        name: form.name, email: form.email, phone: form.phone, date: form.date,
        type, message: form.message, wantsUpdates,
        honeypot: form.honeypot, altcha: altcha ?? '',
      })
      setStatus('sent')
    } catch (err) {
      setError(err instanceof FormError ? err.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <PageShell title="Tips, Complaints &amp; Ideas">
      <figure className="mt-5 overflow-hidden rounded-xl">
        <img src="/images/tips-hero.jpg" alt="A duck on the Hubble terrace pond."
          loading="lazy" className="h-48 w-full object-cover md:h-64" />
      </figure>

      <div className="mt-5 space-y-3 text-hubble-800/80">
        <p>
          Does the smell of our delicious food make you hungry even when you are in your room? Is the
          party &lsquo;going through the roof&rsquo;, taking your room with it? Do you think
          &lsquo;the board should definitely do this!&rsquo;? Fill out this form and we will listen
          to your tips, complaints and ideas.
        </p>
        <p className="text-sm">
          Is something in need of our attention right away? Contact Campus Security on{' '}
          <a href="tel:+31402472020" className="font-semibold text-hubble-700 hover:underline">
            +31 40 247 2020
          </a>
          . They respond immediately.
        </p>
      </div>

      {status === 'sent' ? (
        <div className="mt-8 rounded-xl border border-hubble-100 bg-hubble-50 p-6">
          <h2 className="font-title text-xl font-bold text-hubble-700">Thank you!</h2>
          <p className="mt-2 text-sm text-hubble-800/80">
            Your message has been sent to the team. We appreciate you taking the time. A
            confirmation has been sent to your email address.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="t-name" className={label}>Name *</label>
              <input id="t-name" required value={form.name} onChange={set('name')} className={field} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="t-email" className={label}>Email *</label>
              <input id="t-email" type="email" required value={form.email} onChange={set('email')} className={field} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="t-phone" className={label}>Phone</label>
              <input id="t-phone" value={form.phone} onChange={set('phone')} className={field} placeholder="+316 1234 5678" autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="t-date" className={label}>Date <span className="font-normal text-hubble-800/50">(if relevant)</span></label>
              <input id="t-date" type="date" value={form.date} onChange={set('date')} className={field} />
            </div>
            <div>
              <label htmlFor="t-type" className={label}>Type of submission</label>
              <select id="t-type" value={type} onChange={(e) => setType(e.target.value as ComplaintType)} className={field}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="t-updates" className={label}>I&rsquo;d like to receive updates on this subject</label>
              <select id="t-updates" value={wantsUpdates ? 'yes' : 'no'}
                onChange={(e) => setWantsUpdates(e.target.value === 'yes')} className={field}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="t-message" className={label}>Message *</label>
              <textarea id="t-message" required rows={5} value={form.message} onChange={set('message')} className={field} />
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
    </PageShell>
  )
}
