import { useCallback, useEffect, useId, useRef, useState, type FocusEvent } from 'react'

/**
 * Open/close behaviour for a navigation dropdown (a button that shows a list of links), so it
 * works without a mouse: a click or tap toggles it, Escape closes it and returns focus to the
 * button, and clicking outside, tabbing out of it or choosing a link closes it. Hover can still
 * open it in CSS on devices that really hover; this adds every other way in.
 *
 * Behaviour only: each site renders its own markup and styling and spreads these props on it.
 */
export function useDropdown() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return {
    open,
    close,
    /** On the element wrapping the button and the panel. */
    containerProps: {
      ref: containerRef,
      onBlur: (e: FocusEvent) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      },
    },
    /** On the button that opens the panel. */
    buttonProps: {
      ref: buttonRef,
      'aria-expanded': open,
      'aria-controls': panelId,
      onClick: () => setOpen((value) => !value),
    },
    /** On the panel with the links; following one closes it. */
    panelProps: {
      id: panelId,
      onClick: (e: { target: EventTarget }) => {
        if ((e.target as HTMLElement).closest('a')) setOpen(false)
      },
    },
  }
}
