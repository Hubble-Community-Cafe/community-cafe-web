import { getJson } from './client'
import type { Vacancy } from '../types/vacancy'

export function getVacancies(bar: string): Promise<Vacancy[]> {
  return getJson<Vacancy[]>(`/api/vacancies/${bar}`)
}
