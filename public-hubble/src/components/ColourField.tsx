import { useEffect, useId, useRef, useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import { DEFAULT_COLOUR, normaliseHex } from '../lib/colour'

interface Props {
  id: string
  value: string
  onChange: (value: string) => void
  className: string
}

/**
 * Hex colour text field with a swatch that previews the colour and opens a small picker.
 * The text stays the source of truth, so typing and picking always agree.
 */
export function ColourField({ id, value, onChange, className }: Props) {
  const [open, setOpen] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const swatch = useRef<HTMLButtonElement>(null)
  const popoverId = useId()
  const colour = normaliseHex(value) ?? DEFAULT_COLOUR

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); swatch.current?.focus() }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={wrapper} className="relative">
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className={`${className} pr-12`} placeholder={DEFAULT_COLOUR} pattern="^#?[0-9A-Fa-f]{6}$" />
      <button ref={swatch} type="button" aria-label="Pick a colour" aria-expanded={open} aria-controls={popoverId}
        data-colour={colour} onClick={() => setOpen((o) => !o)}
        style={{ backgroundColor: colour }}
        className="absolute right-2 top-1/2 mt-0.5 h-7 w-7 -translate-y-1/2 rounded-md border border-hubble-300 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hubble-500/40" />
      {open && (
        <div id={popoverId} role="dialog" aria-label="Colour picker"
          className="absolute right-0 z-20 mt-2 rounded-xl border border-hubble-200 bg-white p-3 shadow-lg">
          <HexColorPicker color={colour} onChange={(hex) => onChange(hex.toUpperCase())} />
        </div>
      )}
    </div>
  )
}
