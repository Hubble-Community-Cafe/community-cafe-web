import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** The id of the page's `<main>`, which the skip link jumps to. `<main>` also needs `tabIndex={-1}`. */
export const MAIN_CONTENT_ID = 'main-content'

/**
 * After a client-side navigation, start the new page at the top and move focus to `<main>`, so a
 * screen reader announces the new page instead of staying on the link that was clicked. Not on the
 * first load: the browser handles that, and stealing focus there would skip the skip link.
 * `scroller` is what scrolls the page: the window on the public sites, `<main>` in the admin.
 */
export function useFocusMainOnNavigate(scroller: 'window' | 'main' = 'window'): void {
  const { pathname } = useLocation()
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const main = document.getElementById(MAIN_CONTENT_ID)
    if (!main) return
    if (scroller === 'main') main.scrollTop = 0
    else window.scrollTo(0, 0)
    main.focus({ preventScroll: true })
  }, [pathname, scroller])
}
