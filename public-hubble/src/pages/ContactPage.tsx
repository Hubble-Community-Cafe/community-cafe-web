import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { usePageSeo } from '../lib/seo'

const FORMS: { to: string; title: string; desc: string }[] = [
  { to: '/contact/tips', title: 'Tips, Complaints & Ideas', desc: 'Share a tip, raise a complaint, or suggest an idea for Hubble.' },
  { to: '/contact/information', title: 'Information form', desc: 'Ask us a general question about Hubble.' },
  { to: '/contact/declarations', title: 'Online declarations', desc: 'Submit an expense declaration with your receipt.' },
  { to: '/contact/screens', title: 'Poster screens', desc: 'Request a slide on the screens throughout Hubble.' },
  { to: '/contact/loan-equipment', title: 'Loan equipment', desc: 'Borrow equipment as a connected association.' },
]

export function ContactPage() {
  usePageSeo('Contact', 'Reach the right Hubble team: tips and complaints, information, declarations, poster screens, or loan equipment.')
  return (
    <PageShell
      title="Contact"
      intro="Pick the form that fits your question and it reaches the right team. For an order, ask at the bar; the address, email and opening hours are in the footer."
    >
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {FORMS.map((f) => (
          <li key={f.to}>
            <Link to={f.to}
              className="block h-full rounded-xl border border-hubble-100 bg-white p-5 shadow-sm transition hover:border-hubble-300 hover:shadow-md">
              <h2 className="font-title text-lg font-bold text-hubble-700">{f.title}</h2>
              <p className="mt-1.5 text-sm text-hubble-800/80">{f.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </PageShell>
  )
}
