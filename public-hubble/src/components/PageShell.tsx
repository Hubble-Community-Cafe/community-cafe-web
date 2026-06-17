import type { ReactNode } from 'react'

/**
 * A simple titled content section for routed pages. Pages whose content is not
 * built yet pass `placeholder` to show an honest "coming soon" note rather than
 * pretending to be complete.
 */
export function PageShell({
  title,
  intro,
  placeholder,
  children,
}: {
  title: string
  intro?: string
  placeholder?: boolean
  children?: ReactNode
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-title text-3xl font-bold text-hubble-700 md:text-4xl">{title}</h1>
      {intro && <p className="mt-3 max-w-2xl text-hubble-800/80">{intro}</p>}
      {placeholder && (
        <p className="mt-8 rounded-xl border border-dashed border-hubble-200 bg-hubble-50 px-4 py-6 text-sm text-hubble-700">
          This section is being rebuilt and will be available soon.
        </p>
      )}
      {children}
    </section>
  )
}
