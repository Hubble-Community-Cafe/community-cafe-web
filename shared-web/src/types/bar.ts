/** The two bars. Content scoped to one bar uses this; a null scope means shared. */
export type BarLocation = 'HUBBLE' | 'METEOR'

/** A bar scope where `null` means the content applies to both bars. */
export type BarScope = BarLocation | null

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'
