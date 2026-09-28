import type { ReactNode } from 'react'
import { cn } from '@cafe/shared-web'

/** Inline Markdown subset: **bold**, *italic* and `code`. */
function renderInline(text: string): ReactNode {
  const parts: ReactNode[] = []
  const pattern = /(\*\*(.+?)\*\*|`(.+?)`|\*(.+?)\*)/g
  let last = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2]) parts.push(<strong key={match.index} className="font-semibold text-slate-900">{match[2]}</strong>)
    else if (match[3]) parts.push(<code key={match.index} className="rounded bg-slate-100 px-1 py-0.5 text-xs">{match[3]}</code>)
    else if (match[4]) parts.push(<em key={match.index}>{match[4]}</em>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

/** Block Markdown subset: `## ` and `### ` headings, `- ` bullets, `1. ` steps and paragraphs. */
export function renderGuideText(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let list: { ordered: boolean; items: ReactNode[] } | null = null
  const flush = () => {
    if (!list) return
    const className = cn('ml-5 space-y-1 text-sm text-slate-700', list.ordered ? 'list-decimal' : 'list-disc')
    nodes.push(list.ordered
      ? <ol key={`l${nodes.length}`} className={className}>{list.items}</ol>
      : <ul key={`l${nodes.length}`} className={className}>{list.items}</ul>)
    list = null
  }
  text.split('\n').forEach((line, i) => {
    const bullet = line.match(/^[-*]\s+(.*)/)
    const step = line.match(/^\d+\.\s+(.*)/)
    if (bullet || step) {
      const ordered = !!step
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] } }
      list.items.push(<li key={i}>{renderInline((bullet ?? step)![1])}</li>)
      return
    }
    flush()
    if (line.trim() === '') return
    if (line.startsWith('### ')) nodes.push(<h4 key={i} className="mt-4 text-sm font-semibold text-slate-800">{line.slice(4)}</h4>)
    else if (line.startsWith('## ')) nodes.push(<h3 key={i} className="mt-4 text-base font-semibold text-slate-900">{line.slice(3)}</h3>)
    else nodes.push(<p key={i} className="text-sm leading-relaxed text-slate-700">{renderInline(line)}</p>)
  })
  flush()
  return nodes
}
