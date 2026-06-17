import type { BarScope } from './bar'

export type BoardType = 'EXECUTIVE' | 'SUPERVISORY'

/**
 * A board term. The current executive board is shared (bar = null); previous
 * boards are per-bar; the supervisory board (Hubble) is its own type.
 */
export interface BoardTerm {
  id: number
  label: string
  type: BoardType
  bar: BarScope
  isCurrent: boolean
  members: BoardMember[]
}

export interface BoardMember {
  id: number
  termId: number
  name: string
  role: string
  photoId: number | null
  sortOrder: number
}
