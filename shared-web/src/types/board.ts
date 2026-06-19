import type { BarScope } from './bar'

export type BoardType = 'EXECUTIVE' | 'SUPERVISORY'

/**
 * A board term. The current executive board is shared (bar = null); previous
 * boards are per-bar; the supervisory board is SUPERVISORY type, scoped to Hubble.
 */
export interface BoardTerm {
  id: number
  label: string
  type: BoardType
  bar: BarScope
  current: boolean
  sortOrder: number
  groupPhotoUrl: string | null
  groupPhotoAlt: string | null
  photoCredit: string | null
  members: BoardMember[]
}

export interface BoardMember {
  id: number
  termId: number
  name: string
  role: string | null
  photoId: number | null
  photoUrl: string | null
  photoAlt: string | null
  sortOrder: number
}
