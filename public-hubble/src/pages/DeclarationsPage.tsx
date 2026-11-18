import { useState } from 'react'
import {
  submitDeclarationForm, formsChallengeUrl, checkUpload, RECEIPT_UPLOAD, useFormSubmit,
} from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { AltchaWidget } from '@cafe/shared-web/altcha'
import { usePageSeo } from '../lib/seo'

const CATEGORIES = ['Board Costs', 'Committee Costs', 'Event Costs', 'Bar Costs', 'Other']

const field =
  'mt-1 w-full rounded-lg border border-hubble-200 bg-white px-3 py-2.5 text-sm text-hubble-900 ' +
  'outline-none transition focus-visible:border-hubble-500 focus-visible:ring-2 focus-visible:ring-hubble-500/30 ' +
  // Marked wrong by useFormSubmit until it is changed.
  'aria-[invalid=true]:border-red-600'
const label = 'block text-sm font-semibold text-hubble-800'

export function DeclarationsPage() {
  usePageSeo('Online Declarations', 'Submit an expense declaration to the Hubble treasurer with your receipt.')
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', iban: '', dateOfPurchase: '',
    amount: '', category: 'Board Costs', description: '', honeypot: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const { setAltcha, status, error, errorId, send, fieldProps, formProps } = useFormSubmit()

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    void send(async (altcha) => {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      data.append('altcha', altcha)
      data.append('file', file!) // never null here: the check ran first
      await submitDeclarationForm(data)
    }, () => {
      const problem = checkUpload(file, RECEIPT_UPLOAD)
      return problem ? { message: problem, field: 'file' } : null
    })
  }

  return (
    <PageShell title="Online Declarations">
      <p className="mt-3 text-sm italic text-hubble-800/70">
        When invoiced to an address, make sure it reads &ldquo;Hubble inz. Bar Potential B.V., De
        Lampendriessen 31-05, 5612 AH Eindhoven&rdquo;. Only receipts that clearly state VAT are accepted.
      </p>

      {status === 'sent' ? (
        <div className="mt-8 rounded-xl border border-hubble-100 bg-hubble-50 p-6">
          <h2 className="font-title text-xl font-bold text-hubble-700">Declaration submitted</h2>
          <p className="mt-2 text-sm text-hubble-800/80">
            Thanks! Your declaration and receipt have been sent to the treasurer. A confirmation
            has been sent to your email address.
          </p>
        </div>
      ) : (
        <form {...formProps} onSubmit={submit} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="d-name" className={label}>Full name *</label>
              <input id="d-name" required value={form.fullName} {...fieldProps('fullName')} onChange={set('fullName')} className={field} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="d-email" className={label}>Email address *</label>
              <input id="d-email" type="email" required value={form.email} {...fieldProps('email')} onChange={set('email')} className={field} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="d-phone" className={label}>Phone number</label>
              <input id="d-phone" value={form.phone} {...fieldProps('phone')} onChange={set('phone')} className={field} placeholder="+316 1234 5678" autoComplete="tel" />
            </div>
            <div>
              <label htmlFor="d-iban" className={label}>IBAN *</label>
              <input id="d-iban" required value={form.iban} {...fieldProps('iban')} onChange={set('iban')} className={field} placeholder="NL00 BANK 0000 0000 00" />
            </div>
            <div>
              <label htmlFor="d-date" className={label}>Date of purchase *</label>
              <input id="d-date" type="date" required value={form.dateOfPurchase} {...fieldProps('dateOfPurchase')} onChange={set('dateOfPurchase')} className={field} />
            </div>
            <div>
              <label htmlFor="d-amount" className={label}>Amount in euros *</label>
              <input id="d-amount" required value={form.amount} {...fieldProps('amount')} onChange={set('amount')} className={field} placeholder="1,23" inputMode="decimal" />
            </div>
            <div>
              <label htmlFor="d-cat" className={label}>Category *</label>
              <select id="d-cat" value={form.category} {...fieldProps('category')} onChange={set('category')} className={field}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="d-file" className={label}>Receipt *</label>
              <input id="d-file" type="file" {...fieldProps('file')} accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full rounded aria-[invalid=true]:outline-2 aria-[invalid=true]:outline-offset-4 aria-[invalid=true]:outline-red-600 text-sm text-hubble-800 file:mr-3 file:rounded file:border-0 file:bg-hubble-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-hubble-600" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="d-desc" className={label}>Description</label>
              <textarea id="d-desc" rows={4} value={form.description} {...fieldProps('description')} onChange={set('description')} className={field}
                placeholder="What the costs were for (event/committee), and an explanation of the receipt items if not self-explanatory." />
            </div>
          </div>

          <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website"
            value={form.honeypot} onChange={set('honeypot')} className="hidden" />

          <div className="pb-2">
            <AltchaWidget challengeUrl={formsChallengeUrl()} onVerified={setAltcha} />
          </div>

          {error && (
            <p id={errorId} className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>
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
