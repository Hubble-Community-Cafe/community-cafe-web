import { useState } from 'react'
import { submitComplaint, FormError, formsChallengeUrl, type ComplaintType } from '@cafe/shared-web'
import { AltchaWidget } from '../components/AltchaWidget'

const TYPES: { value: ComplaintType; label: string }[] = [
  { value: 'TIP', label: 'Tip' },
  { value: 'COMPLAINT', label: 'Complaint' },
  { value: 'IDEA', label: 'Idea' },
]

const fieldClass =
  'mt-1 w-full rounded-lg border border-meteor-200 bg-white px-3 py-2.5 text-sm text-meteor-900 ' +
  'shadow-sm outline-none transition focus:border-meteor-accent focus:ring-2 focus:ring-meteor-accent/40'
const labelClass = 'block text-sm font-semibold text-meteor-900'

export function ComplaintsPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<ComplaintType>('TIP')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [altcha, setAltcha] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      await submitComplaint({ name, email, phone, date, type, message, honeypot, altcha: altcha ?? '' })
      setStatus('sent')
    } catch (err) {
      setError(err instanceof FormError ? err.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-title text-3xl font-bold uppercase text-meteor-900 md:text-4xl">
        Tips, Complaints &amp; Ideas
      </h1>
      <div className="mt-4 space-y-3 text-meteor-800/80">
        <p>
          Does the smell of our food make you hungry even when you are upstairs? Is the party going
          through the roof? Do you think the board should definitely do something? Fill out this form
          and we will listen to your tips, complaints and ideas.
        </p>
        <p className="text-sm">
          Is something in need of our attention right away? Contact Campus Security on{' '}
          <a href="tel:+31402472020" className="font-semibold text-meteor-700 hover:underline">
            +31 40 247 2020
          </a>
          . They respond immediately.
        </p>
      </div>

      {status === 'sent' ? (
        <div className="mt-8 rounded-2xl border border-meteor-200 bg-meteor-50 p-6 text-meteor-900">
          <h2 className="font-title text-xl font-bold">Thank you!</h2>
          <p className="mt-2 text-sm text-meteor-800/80">
            Your message has been sent to the team. We appreciate you taking the time. A
            confirmation has been sent to your email address.
          </p>
        </div>
      ) : (
        <form
          onSubmit={submit}
          noValidate
          className="mt-8 space-y-5 rounded-2xl border border-meteor-100 bg-white p-6 shadow-sm md:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className={labelClass}>Name *</label>
              <input id="name" required maxLength={200} value={name}
                onChange={(e) => setName(e.target.value)} className={fieldClass} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>Email *</label>
              <input id="email" type="email" required maxLength={200} value={email}
                onChange={(e) => setEmail(e.target.value)} className={fieldClass} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                className={fieldClass} placeholder="+316 1234 5678" autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="date" className={labelClass}>Date <span className="font-normal text-meteor-800/50">(if relevant)</span></label>
              <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="type" className={labelClass}>Type</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value as ComplaintType)}
                className={fieldClass}>
                {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className={labelClass}>Message *</label>
              <textarea id="message" required rows={5} maxLength={5000} value={message}
                onChange={(e) => setMessage(e.target.value)} className={fieldClass} />
            </div>
          </div>

          {/* Honeypot: hidden from people, tempting to bots. */}
          <input
            type="text" tabIndex={-1} autoComplete="off" value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)} aria-hidden="true"
            className="hidden" name="website"
          />

          <div className="pb-2">
            <AltchaWidget challengeUrl={formsChallengeUrl()} onVerified={setAltcha} />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>
          )}

          <button type="submit" disabled={status === 'sending'}
            className="w-full rounded-lg bg-meteor-900 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-meteor-800 disabled:opacity-60 sm:w-auto">
            {status === 'sending' ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}
    </div>
  )
}
