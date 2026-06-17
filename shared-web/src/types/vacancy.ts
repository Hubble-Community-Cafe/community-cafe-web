import type { BarScope } from './bar'

export interface Vacancy {
  id: number
  title: string
  description: string
  /** Free-text hours/commitment, e.g. "4-8 hrs/week". */
  hours: string | null
  /** Free-text type, e.g. "Volunteer", "Committee". */
  type: string | null
  applyEmail: string | null
  applyLink: string | null
  /** Null means the vacancy applies to both bars. */
  bar: BarScope
  active: boolean
}
