import { useState } from 'react'
import { submitInformation, FormError, formsChallengeUrl } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { AltchaWidget } from '../components/AltchaWidget'

const field =
  'mt-1 w-full rounded-lg border border-hubble-200 bg-white px-3 py-2.5 text-sm text-hubble-900 ' +
  'outline-none transition focus:border-hubble-500 focus:ring-2 focus:ring-hubble-500/30'
const label = 'block text-sm font-semibold text-hubble-800'

export function InformationPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', honeypot: '' })
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
      await submitInformation({
        name: form.name, email: form.email, phone: form.phone, message: form.message,
        honeypot: form.honeypot, altcha: altcha ?? '',
      })
      setStatus('sent')
    } catch (err) {
      setError(err instanceof FormError ? err.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <PageShell title="Information Form">
      <p className="mt-3 text-hubble-800/80">
        Have a question for Hubble? Send us a message below. Organizing something in Hubble?{' '}
        <a href="https://harry.hubble.cafe" target="_blank" rel="noreferrer"
          className="font-semibold text-hubble-700 hover:underline">
          Use our event form.
        </a>
      </p>

      {status === 'sent' ? (
        <div className="mt-8 rounded-xl border border-hubble-100 bg-hubble-50 p-6">
          <h2 className="font-title text-xl font-bold text-hubble-700">Thank you!</h2>
          <p className="mt-2 text-sm text-hubble-800/80">
            Your message has been sent. We will get back to you. A confirmation has been sent to
            your email address.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="i-name" className={label}>Name *</label>
              <input id="i-name" required value={form.name} onChange={set('name')} className={field} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="i-email" className={label}>Email *</label>
              <input id="i-email" type="email" required value={form.email} onChange={set('email')} className={field} autoComplete="email" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="i-phone" className={label}>Phone</label>
              <input id="i-phone" value={form.phone} onChange={set('phone')} className={field} placeholder="+316 1234 5678" autoComplete="tel" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="i-message" className={label}>Message *</label>
              <textarea id="i-message" required rows={5} value={form.message} onChange={set('message')} className={field} />
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
