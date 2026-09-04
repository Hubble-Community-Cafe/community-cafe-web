import { arrayMove } from '@dnd-kit/sortable'

/**
 * Work out the order a drop produces, or null when the drop changes nothing. Split out from
 * SortableList so the ordering itself can be tested without a real pointer; the gesture is
 * covered end to end by the Playwright specs, which have the layout jsdom lacks.
 */
export function reorderById<T>(
  items: T[],
  getId: (item: T) => number,
  activeId: number,
  overId: number,
): T[] | null {
  if (activeId === overId) return null
  const from = items.findIndex((i) => getId(i) === activeId)
  const to = items.findIndex((i) => getId(i) === overId)
  if (from === -1 || to === -1) return null
  return arrayMove(items, from, to)
}
