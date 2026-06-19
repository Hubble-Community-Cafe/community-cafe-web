import type { BarScope } from './bar'

export interface Association {
  id: number
  name: string
  logoId: number | null
  logoUrl: string | null
  logoAlt: string | null
  /** Null means the association applies to both bars. */
  bar: BarScope
}
