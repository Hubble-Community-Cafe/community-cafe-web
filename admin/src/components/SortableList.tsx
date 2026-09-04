import { type ReactNode, useMemo } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { reorderById } from '../lib/reorder'

interface SortableListProps<T> {
  items: T[]
  getId: (item: T) => number
  /** Accessible name of a row, e.g. the item or member name. */
  labelFor: (item: T) => string
  /**
   * The list in its new order. Callers apply it to their own state before awaiting the request and
   * put the old order back if it fails, the same optimistic pattern as the visibility toggles.
   */
  onReorder: (items: T[]) => void
  /** Hides the handles, for read-only viewers or while another interaction owns the rows. */
  disabled?: boolean
  /**
   * Rows this returns false for show no handle and stay put, for a row that is a poor drag target
   * at the moment, such as an expanded panel. Other rows can still be dragged around them.
   */
  draggable?: (item: T) => boolean
  className?: string
  /** Renders one row. The handle is null when dragging is disabled. */
  children: (item: T, handle: ReactNode) => ReactNode
}

/**
 * A vertical list whose rows can be dragged into a new order, by pointer, touch, or keyboard
 * (focus a handle, space to pick up, arrows to move, space to drop, escape to cancel). Replaces
 * the sort-order number field, which got unworkable once a list ran past a handful of rows.
 */
export function SortableList<T>({
  items,
  getId,
  labelFor,
  onReorder,
  disabled = false,
  draggable,
  className,
  children,
}: SortableListProps<T>) {
  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so tapping a row's own buttons still works.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = useMemo(() => items.map(getId), [items, getId])
  const nameOf = (id: number) => {
    const item = items.find((i) => getId(i) === id)
    return item ? labelFor(item) : 'item'
  }
  const positionOf = (id: number) => ids.indexOf(id) + 1

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return
    const next = reorderById(items, getId, Number(active.id), Number(over.id))
    if (next) onReorder(next)
  }

  if (disabled) {
    return <div className={className}>{items.map((item) => children(item, null))}</div>
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) =>
            `Picked up ${nameOf(Number(active.id))}, position ${positionOf(Number(active.id))} of ${items.length}.`,
          onDragOver: ({ active, over }) =>
            over
              ? `${nameOf(Number(active.id))} is now at position ${positionOf(Number(over.id))} of ${items.length}.`
              : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? `${nameOf(Number(active.id))} dropped at position ${positionOf(Number(over.id))} of ${items.length}.`
              : `${nameOf(Number(active.id))} dropped.`,
          onDragCancel: ({ active }) =>
            `Reordering cancelled. ${nameOf(Number(active.id))} is back at position ${positionOf(Number(active.id))}.`,
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {items.map((item) => (
            <SortableRow
              key={getId(item)}
              id={getId(item)}
              label={labelFor(item)}
              draggable={draggable ? draggable(item) : true}
            >
              {(handle) => children(item, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

function SortableRow({
  id,
  label,
  draggable,
  children,
}: {
  id: number
  label: string
  draggable: boolean
  children: (handle: ReactNode) => ReactNode
}) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging,
  } = useSortable({ id, disabled: !draggable })

  const handle = !draggable ? null : (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Reorder ${label}`}
      title={`Drag to reorder ${label}`}
      // touch-none stops the browser scrolling the page instead of starting the drag. The handle
      // is a full 44px target on a phone, where the drag has to be pressed and held precisely,
      // and shrinks back to an icon-sized button once there is a pointer.
      className="flex min-h-11 min-w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing sm:min-h-0 sm:min-w-0 sm:p-1.5"
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10 opacity-90 shadow-lg' : undefined}
    >
      {children(handle)}
    </div>
  )
}
