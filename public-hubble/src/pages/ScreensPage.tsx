import { useState } from 'react'
import { submitScreenForm, FormError, formsChallengeUrl } from '@cafe/shared-web'
import { PageShell } from '../components/PageShell'
import { AltchaWidget } from '../components/AltchaWidget'
import { usePageSeo } from '../lib/seo'

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPTED = ['image/jpeg', 'image/png', 'video/mp4']

const field =
  'mt-1 w-full rounded-lg border border-hubble-200 bg-white px-3 py-2.5 text-sm text-hubble-900 ' +
  'outline-none transition focus:border-hubble-500 focus:ring-2 focus:ring-hubble-500/30'
const label = 'block text-sm font-semibold text-hubble-800'

const REQUIREMENTS = [
  'Supported files: .jpg / .png / .mp4',
  'Dimensions: 16:9 (maximum 3840 × 2160 pixels)',
  'Maximum video duration: 30 seconds',
  'Maximum file size: 10 MB',
  'A clock is placed in the bottom-right corner; leave space and contrast there. You may choose its colour.',
  'Default maximum duration a slide is shown is 2 weeks.',
  'The board always has the right to deny your request. This can be because the slide is inappropriate / political / rude / etc.',
  'Every connected association can send one slide conforming to the guidelines. This slide will be displayed permanently (or until you change it) on the screens; Note that this slide cannot be used to promote events, for that the second bullet point applies.',
  'Every association can still request one more promotion slide displayed for a maximum of two weeks. This period will be enforced strictly, and exceptions must be requested with motivation and will only be granted on exceptional occasions.',
]

export function ScreensPage() {
  usePageSeo('Hubble Poster Screens', 'Request a poster slide on the screens throughout Hubble, with the requirements and guidelines.')
  const [form, setForm] = useState({
    name: '', association: '', email: '', cafe: 'HUBBLE',
    startDate: '', endDate: '', hexColor: '', message: '', honeypot: '',
  })
  const [permanent, setPermanent] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [altcha, setAltcha] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  // A dated request longer than two weeks is allowed but normally won't be approved for an event.
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000
  const periodTooLong =
    !permanent && !!form.startDate && !!form.endDate &&
    new Date(form.endDate).getTime() - new Date(form.startDate).getTime() > TWO_WEEKS_MS

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!file) { setError('Please choose a poster file (JPG, PNG or MP4).'); return }
    if (!ACCEPTED.includes(file.type)) { setError('Unsupported file type. Use JPG, PNG or MP4.'); return }
    if (file.size > MAX_BYTES) { setError('That file is larger than 10 MB.'); return }
    if (!permanent) {
      if (!form.startDate || !form.endDate) {
        setError('Please choose a start and end date, or tick the permanent-poster box.'); return
      }
      if (form.endDate < form.startDate) { setError('The end date must be on or after the start date.'); return }
    }

    setStatus('sending')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => data.append(k, v))
      data.append('permanent', String(permanent))
      data.append('altcha', altcha ?? '')
      data.append('file', file)
      await submitScreenForm(data)
      setStatus('sent')
    } catch (err) {
      setError(err instanceof FormError ? err.message : 'Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  return (
    <PageShell title="Hubble Poster Screens">
      <p className="mt-3 text-hubble-800/80">
        We have poster screens throughout Hubble. Associations in our community can request slides to
        be shown. Want to post a slide? Submit your request below.
      </p>

      <section className="mt-6 rounded-xl border border-hubble-100 bg-hubble-50 p-5">
        <h2 className="font-title text-lg font-bold text-hubble-700">Poster requirements</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-hubble-800/90">
          {REQUIREMENTS.map((r) => <li key={r}>{r}</li>)}
        </ul>
        <figure className="mt-5">
          <img
            src="/images/screens-styleguide.jpg"
            alt="Slide guide showing where the clock and progress bar appear and how to align your poster."
            loading="lazy"
            className="w-full rounded-lg border border-hubble-100"
          />
          <figcaption className="mt-2 text-xs text-hubble-700/70">
            Alignment example: keep contrast and space for the clock and progress bar in the lower area.
          </figcaption>
        </figure>
      </section>

      {status === 'sent' ? (
        <div className="mt-8 rounded-xl border border-hubble-100 bg-hubble-50 p-6">
          <h2 className="font-title text-xl font-bold text-hubble-700">Request received</h2>
          <p className="mt-2 text-sm text-hubble-800/80">
            Thanks! Your screen request and poster have been sent to the screens team. A
            confirmation has been sent to your email address.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="s-name" className={label}>Name *</label>
              <input id="s-name" required value={form.name} onChange={set('name')} className={field} />
            </div>
            <div>
              <label htmlFor="s-assoc" className={label}>Association *</label>
              <input id="s-assoc" required value={form.association} onChange={set('association')} className={field} />
            </div>
            <div>
              <label htmlFor="s-email" className={label}>Email *</label>
              <input id="s-email" type="email" required value={form.email} onChange={set('email')} className={field} />
            </div>
            <div>
              <label htmlFor="s-cafe" className={label}>Which café? *</label>
              <select id="s-cafe" value={form.cafe} onChange={set('cafe')} className={field}>
                <option value="HUBBLE">Hubble</option>
                <option value="METEOR">Meteor</option>
                <option value="BOTH">Both</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-start gap-2.5 text-sm text-hubble-900">
                <input type="checkbox" checked={permanent}
                  onChange={(e) => setPermanent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-hubble-300 text-hubble-700 focus:ring-hubble-500/40" />
                <span>I want to use this poster as our association&rsquo;s permanent poster (no dates).</span>
              </label>
              {permanent && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  A permanent poster is a general association poster shown until you change it. It
                  <strong> cannot promote a specific event</strong>; for an event, untick this and pick a
                  start and end date.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="s-start" className={label}>Start date {!permanent && '*'}</label>
              <input id="s-start" type="date" required={!permanent} disabled={permanent}
                value={form.startDate} onChange={set('startDate')}
                className={`${field} disabled:cursor-not-allowed disabled:bg-hubble-50 disabled:text-hubble-400`} />
            </div>
            <div>
              <label htmlFor="s-end" className={label}>End date {!permanent && '*'}</label>
              <input id="s-end" type="date" required={!permanent} disabled={permanent}
                value={form.endDate} onChange={set('endDate')}
                className={`${field} disabled:cursor-not-allowed disabled:bg-hubble-50 disabled:text-hubble-400`} />
            </div>

            {periodTooLong && (
              <p className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                This period is more than 2 weeks and will normally not be approved for an event poster.
                Exceptions must be requested with motivation. If this is a permanent poster, tick the box above.
              </p>
            )}
            <div>
              <label htmlFor="s-hex" className={label}>Clock / progress colour <span className="font-normal text-hubble-800/50">(optional hex)</span></label>
              <input id="s-hex" value={form.hexColor} onChange={set('hexColor')} className={field}
                placeholder="#FFF200" pattern="^#?[0-9A-Fa-f]{6}$" />
            </div>
            <div>
              <label htmlFor="s-file" className={label}>Poster file *</label>
              <input id="s-file" type="file" accept=".jpg,.jpeg,.png,.mp4,image/jpeg,image/png,video/mp4"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-hubble-800 file:mr-3 file:rounded file:border-0 file:bg-hubble-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-hubble-600" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="s-msg" className={label}>Message</label>
              <textarea id="s-msg" rows={4} value={form.message} onChange={set('message')} className={field} />
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
            {status === 'sending' ? 'Sending…' : 'Send request'}
          </button>
        </form>
      )}
    </PageShell>
  )
}
