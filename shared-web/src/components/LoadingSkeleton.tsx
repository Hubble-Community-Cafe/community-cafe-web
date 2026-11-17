import type { ReactNode } from 'react'

/**
 * A loading skeleton that screen readers can hear. The shimmer blocks inside are decorative
 * (aria-hidden), so on their own a screen reader user got no sign anything was loading.
 */
export function LoadingSkeleton({ className, testId, children }: {
  className?: string
  testId?: string
  children: ReactNode
}) {
  return (
    <div role="status" className={className} data-testid={testId}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  )
}
