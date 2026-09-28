import { useEffect, useId, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, HelpCircle, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { cn } from '@cafe/shared-web'
import { guideFor, type Guide } from '../lib/guideContent'
import { renderGuideText } from '../lib/guideText'

/**
 * The "Help" button next to a page title, opening that page's guide in a dialog. Staff and board
 * change every year, so each module explains itself here (content in lib/guideContent.ts).
 */
export function HelpGuide({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const titleId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const button = trigger.current
    return () => {
      window.removeEventListener('keydown', onKey)
      button?.focus()
    }
  }, [open])

  const section = guide.sections[index]
  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => { setIndex(0); setOpen(true) }}
        aria-haspopup="dialog"
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
      >
        <HelpCircle className="h-4 w-4" aria-hidden="true" />
        Help
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
              <h2 id={titleId} className="font-title text-lg font-bold text-slate-900">{guide.title}</h2>
              <button ref={close} type="button" onClick={() => setOpen(false)} aria-label="Close help"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {guide.sections.length > 1 && (
              <nav aria-label="Help topics" className="flex flex-wrap gap-1.5 border-b border-slate-100 px-5 py-2">
                {guide.sections.map((s, i) => (
                  <button key={s.title} type="button" onClick={() => setIndex(i)} aria-current={i === index}
                    className={cn('rounded-full px-3 py-1 text-xs font-medium',
                      i === index ? 'bg-hubble-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>
                    {s.title}
                  </button>
                ))}
              </nav>
            )}

            <div className="space-y-2 overflow-y-auto px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">{section.title}</h3>
              {renderGuideText(section.content)}
            </div>

            {guide.sections.length > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm">
                <button type="button" disabled={index === 0} onClick={() => setIndex(index - 1)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous
                </button>
                <span className="text-slate-600">{index + 1} of {guide.sections.length}</span>
                <button type="button" disabled={index === guide.sections.length - 1} onClick={() => setIndex(index + 1)}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40">
                  Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/** The help for the current page, if it has a guide: put this next to the page's <h1>. */
export function PageHelp() {
  const guide = guideFor(useLocation().pathname)
  return guide ? <HelpGuide guide={guide} /> : null
}
