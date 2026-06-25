import type { CSSProperties } from 'react'

/**
 * A shimmering placeholder block for loading skeletons. Decorative only
 * (hidden from assistive tech); the moving sheen comes from the `.shimmer`
 * class in index.css, which is disabled under prefers-reduced-motion.
 */
export function Shimmer({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`shimmer block rounded-md ${className}`} style={style} />
}
