import { getJson } from './client'
import type { BoardTerm } from '../types/board'

export function getBoard(): Promise<BoardTerm[]> {
  return getJson<BoardTerm[]>('/api/board')
}
