import type { BarScope } from './bar'

export interface Vacancy {
  id: number
  title: string
  description: string | null
  hours: string | null
  type: string | null
  applyEmail: string | null
  applyLink: string | null
  imageUrl: string | null
  imageAlt: string | null
  /** Null means the vacancy applies to both bars. */
  bar: BarScope
  active: boolean
  sortOrder: number
}
