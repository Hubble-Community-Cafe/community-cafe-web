import type { BarLocation, BoardMember, BoardType, BoardTerm as SharedBoardTerm } from '@cafe/shared-web'
import { getJson, sendNoContent, deleteResource } from './client'

// ── Board types ─────────────────────────────────────────────────────────────────
export interface BoardTerm extends SharedBoardTerm {
  groupPhotoId: number | null
}

export interface BoardTermRequest {
  label: string
  type: BoardType
  bar: BarLocation | null
  current: boolean
  /** Omit to append on create, or to leave the position alone on update. Set by dragging. */
  sortOrder?: number | null
  groupPhotoId: number | null
  photoCredit: string | null
}

export interface BoardMemberRequest {
  name: string
  role: string | null
  photoId: number | null
  /** Omit to append on create, or to leave the position alone on update. Set by dragging. */
  sortOrder?: number | null
}

// ── Board endpoints ────────────────────────────────────────────────────────────
export const fetchBoardTerms = () =>
  getJson<BoardTerm[]>('/api/admin/board/terms')

export const createBoardTerm = (req: BoardTermRequest) =>
  getJson<BoardTerm>('/api/admin/board/terms', {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateBoardTerm = (id: number, req: BoardTermRequest) =>
  getJson<BoardTerm>(`/api/admin/board/terms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteBoardTerm = (id: number) =>
  deleteResource(`/api/admin/board/terms/${id}`, 'the board term')

export const createBoardMember = (termId: number, req: BoardMemberRequest) =>
  getJson<BoardMember>(`/api/admin/board/terms/${termId}/members`, {
    method: 'POST',
    body: JSON.stringify(req),
  })

export const updateBoardMember = (id: number, req: BoardMemberRequest) =>
  getJson<BoardMember>(`/api/admin/board/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(req),
  })

export const deleteBoardMember = (id: number) =>
  deleteResource(`/api/admin/board/members/${id}`, 'the board member')

/** Apply a dragged order. See reorderMenuCategories for why this is its own call. */
export const reorderBoardTerms = (orderedIds: number[]) =>
  sendNoContent('/api/admin/board/terms/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  })

export const reorderBoardMembers = (termId: number, orderedIds: number[]) =>
  sendNoContent(`/api/admin/board/terms/${termId}/members/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  })
