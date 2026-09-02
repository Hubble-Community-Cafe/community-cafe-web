import { useState } from 'react'
import { submitDeclarationForm, FormError, formsChallengeUrl } from '@cafe/shared-web'
import { AltchaWidget } from '../components/AltchaWidget'
import { usePageSeo } from '../lib/seo'

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png']
const CATEGORIES = ['Board Costs', 'Committee Costs', 'Event Costs', 'Bar Costs', 'Other']

const fieldClass =
  'mt-1 w-full rounded-lg border border-meteor-200 bg-white px-3 py-2.5 text-sm text-meteor-900 ' +
  'shadow-sm outline-none transition focus-visible:border-meteor-accent focus-visible:ring-2 focus-visible:ring-meteor-accent/40'
const labelClass = 'block text-sm font-semibold text-meteor-900'

export function DeclarationsPage() {
  usePageSeo('Online Declarations', 'Submit an expense declaration to the Meteor treasurer with your receipt.')
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', iban: '', dateOfPurchase: '',
    amount: '', category: 'Board Costs', description: '', honeypot: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [altcha, setAltcha] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!file) { setError('Please attach the receipt (PDF or image).'); return }
    if (!ACCEPTED.includes(file.type)) { setError('Unsupported file type. Attach a PDF or image.'); return }
    if (file.size > MAX_BYTES) { setError('That file is larger than 10 MB.'); return }

    setStatus('sending')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      // Meteor and Hubble are separate companies: the bar routes this to Meteor's treasurer.
      data.append('bar', 'METEOR')
      data.append('altcha', altcha ?? '')
      data.append('file', file)
      await submitDeclarationForm(data)
      setStatus('sent')
    } catch (err) {
      setError(err instanceof FormError ? err.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-title text-3xl font-bold uppercase tracking-tight text-meteor-900 md:text-4xl">
        Online Declarations
      </h1>
      <div className="mt-4 space-y-3 text-meteor-800/80">
        <p>
          Made a purchase for Meteor? Fill out this form with your receipt and the treasurer will
          reimburse you.
        </p>
        <p className="text-sm italic">
          When invoiced to an address, make sure it reads &ldquo;Bubble Paviljoen B.V., Blauwe loper
          60, 5612 TA Eindhoven&rdquo;. Only receipts that clearly state VAT are accepted.
        </p>
      </div>

      {status === 'sent' ? (
        <div className="mt-8 rounded-2xl border border-meteor-200 bg-meteor-50 p-6 text-meteor-900">
          <h2 className="font-title text-xl font-bold">Declaration submitted</h2>
          <p className="mt-2 text-sm text-meteor-800/80">
            Thanks! Your declaration and receipt have been sent to the treasurer. A confirmation
            has been sent to your email address.
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
              <label htmlFor="d-name" className={labelClass}>Full name *</label>
              <input id="d-name" required maxLength={200} value={form.fullName}
                onChange={set('fullName')} className={fieldClass} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="d-email" className={labelClass}>Email address *</label>
              <input id="d-email" type="email" required maxLength={200} value={form.email}
                onChange={set('email')} className={fieldClass} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="d-phone" className={labelClass}>Phone number</label>
              <input id="d-phone" value={form.phone} onChange={set('phone')} className={fieldClass}
                placeholder="+316 1234 5678" autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="d-iban" className={labelClass}>IBAN *</label>
              <input id="d-iban" required value={form.iban} onChange={set('iban')} className={fieldClass}
                placeholder="NL00 BANK 0000 0000 00" />
            </div>
            <div>
              <label htmlFor="d-date" className={labelClass}>Date of purchase *</label>
              <input id="d-date" type="date" required value={form.dateOfPurchase}
                onChange={set('dateOfPurchase')} className={fieldClass} />
            </div>
            <div>
              <label htmlFor="d-amount" className={labelClass}>Amount in euros *</label>
              <input id="d-amount" required value={form.amount} onChange={set('amount')}
                className={fieldClass} placeholder="1,23" inputMode="decimal" />
            </div>
            <div>
              <label htmlFor="d-cat" className={labelClass}>Category *</label>
              <select id="d-cat" value={form.category} onChange={set('category')} className={fieldClass}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="d-file" className={labelClass}>Receipt *</label>
              <input id="d-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-meteor-800 file:mr-3 file:rounded file:border-0 file:bg-meteor-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-meteor-800" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="d-desc" className={labelClass}>Description</label>
              <textarea id="d-desc" rows={4} maxLength={5000} value={form.description}
                onChange={set('description')} className={fieldClass}
                placeholder="What the costs were for (event/committee), and an explanation of the receipt items if not self-explanatory." />
            </div>
          </div>

          {/* Honeypot: hidden from people, tempting to bots. */}
          <input
            type="text" tabIndex={-1} autoComplete="off" value={form.honeypot}
            onChange={set('honeypot')} aria-hidden="true"
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
