import type { MouseEvent } from 'react'
import { MAIN_CONTENT_ID } from '../lib/mainContent'

/**
 * "Skip to content": the first focusable element on the page, so keyboard and screen reader users
 * can jump past the header and navigation (WCAG 2.4.1). Visually hidden until it receives focus.
 * Moves focus itself rather than following the #hash, so the URL and router state stay untouched.
 */
export function SkipLink() {
  const skipToContent = (event: MouseEvent<HTMLAnchorElement>) => {
    const main = document.getElementById(MAIN_CONTENT_ID)
    if (!main) return
    event.preventDefault()
    main.focus()
    main.scrollIntoView({ block: 'start' })
  }

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={skipToContent}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-hubble-700 focus:px-4 focus:py-2.5 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-hubble-300"
    >
      Skip to content
    </a>
  )
}
