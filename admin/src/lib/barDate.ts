/** The bars' time zone; the backend decides "today" in this zone too. */
const BAR_TIME_ZONE = 'Europe/Amsterdam'

/**
 * Today's date at the bars as YYYY-MM-DD, whatever time zone the browser is in. A plain
 * toISOString() gives the UTC date, which is still yesterday just after midnight in the Netherlands.
 */
export function barToday(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BAR_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
