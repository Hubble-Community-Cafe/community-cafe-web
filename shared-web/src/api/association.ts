import { getJson } from './client'
import type { Association } from '../types/association'

export function getAssociations(bar: string): Promise<Association[]> {
  return getJson<Association[]>(`/api/associations/${bar}`)
}
