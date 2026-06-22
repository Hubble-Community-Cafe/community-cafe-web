import { Link } from 'react-router-dom'
import { PageShell } from '../components/PageShell'
import { usePageSeo } from '../lib/seo'

export function NotFoundPage() {
  usePageSeo('Page not found', 'This page could not be found.', { index: false })
  return (
    <PageShell title="Page not found" intro="The page you were looking for does not exist.">
      <Link to="/"
        className="mt-6 inline-block rounded-lg bg-hubble-700 px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-hubble-600">
        Back to home
      </Link>
    </PageShell>
  )
}
