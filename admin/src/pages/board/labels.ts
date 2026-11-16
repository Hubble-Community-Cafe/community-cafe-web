import type { BoardTerm, BoardType } from '../../lib/api'

export const TYPE_LABELS: Record<BoardType, string> = {
  EXECUTIVE: 'Executive board',
  SUPERVISORY: 'Supervisory board',
}
export const BAR_LABELS: Record<string, string> = {
  HUBBLE: 'Hubble',
  METEOR: 'Meteor',
}

export function termScope(term: BoardTerm): string {
  if (term.bar) return BAR_LABELS[term.bar] ?? term.bar
  return 'Shared'
}
