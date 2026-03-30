import {
	closestCenter,
	type DragCancelEvent,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { type ReactNode, useMemo, useState } from 'react'
import Analytics from '@/analytics'
import { useAppearanceSetting } from '@/context/appearance.context'
import { DateProvider } from '@/context/date.context'
import { useWidgetVisibility, type WidgetItem, WidgetKeys } from '@/context/widget-visibility.context'
import { HomeContentSimplify } from './home-content-simplify'

const layoutPositions: Record<string, string> = {
	center: 'justify-center',
	top: 'justify-start',
}

const GRID_ROWS = 3
const GRID_COLUMNS = 4
const GRID_SLOT_COUNT = GRID_ROWS * GRID_COLUMNS

function EmptyGridSlot({
	slotId,
	showDropZone,
	isHighlighted = false,
}: {
	slotId: string
	showDropZone: boolean
	isHighlighted?: boolean
}) {
	const { setNodeRef } = useDroppable({ id: slotId })

	return (
		<div
			ref={setNodeRef}
			className={`min-h-[210px] md:min-h-[240px] rounded-2xl transition-all duration-200 ${
				showDropZone
					? `border border-dashed ${
						isHighlighted
							? 'border-primary bg-primary/10'
							: 'border-primary/20 bg-transparent'
					}`
					: 'invisible'
			}`}
		/>
	)
}

const getWidgetSpan = (widget?: WidgetItem) =>
	widget?.gridSpan?.includes('col-span-2') ? 2 : 1

const canPlaceAt = (startIndex: number, span: number, occupied: boolean[]) => {
	if (startIndex < 0 || startIndex + span > GRID_SLOT_COUNT) {
		return false
	}
	const col = startIndex % GRID_COLUMNS
	if (col + span > GRID_COLUMNS) {
		return false
	}
	for (let i = 0; i < span; i += 1) {
		if (occupied[startIndex + i]) {
			return false
		}
	}
	return true
}

const findAvailableStart = (
	preferredStart: number,
	span: number,
	occupied: boolean[]
) => {
	for (let start = preferredStart; start < GRID_SLOT_COUNT; start += 1) {
		if (canPlaceAt(start, span, occupied)) {
			return start
		}
	}
	for (let start = 0; start < preferredStart; start += 1) {
		if (canPlaceAt(start, span, occupied)) {
			return start
		}
	}
	return -1
}

function SortableWidget({
	widget,
	disabled,
	displaceDirection,
}: {
	widget: WidgetItem
	disabled?: boolean
	/** 'left' | 'right' | null — the direction this widget will slide when another is dragged over it */
	displaceDirection?: 'left' | 'right' | null
}) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({
			id: widget.id,
			disabled: disabled ?? false,
		})

	// Use translate-only transform — CSS.Transform.toString also applies scaleX/scaleY
	// from rectSortingStrategy which stretches/collapses widgets of different spans.
	const displaceOffset = displaceDirection === 'left' ? -20 : displaceDirection === 'right' ? 20 : 0
	const style = {
		transform: transform
			? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
			: displaceDirection
				? `translate3d(${displaceOffset}px, 0, 0)`
				: undefined,
		transition: displaceDirection ? 'transform 200ms ease, opacity 200ms ease' : transition,
		zIndex: isDragging ? 999 : 'auto',
		opacity: displaceDirection ? 0.45 : undefined,
	}

	const dragListeners = {
		...listeners,
		onPointerDown: (event: React.PointerEvent) => {
			const target = event.target as HTMLElement
			const isInput =
				target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.contentEditable === 'true' ||
				target.closest('input, textarea, [contenteditable="true"]') ||
				target.closest('button, select, a')

			if (isInput) {
				return
			}

			if (listeners?.onPointerDown) {
				listeners.onPointerDown(event)
			}
		},
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...dragListeners}
			className={`${widget.gridSpan || ''} ${
				isDragging
					? 'opacity-40 cursor-grabbing'
					: displaceDirection
						? 'cursor-grab'
						: 'cursor-grab hover:scale-[1.02] transition-transform duration-200'
			}`}
		>
			{widget.node}
		</div>
	)
}

export function ContentSection() {
	const { contentAlignment, canReOrderWidget } = useAppearanceSetting()

	const { getSortedWidgets, setWidgetOrder } = useWidgetVisibility()
	const sortedWidgets = getSortedWidgets().filter((widget) => !widget.disabled)

	const totalWidgetCount = sortedWidgets.length
	const [activeDragWidgetId, setActiveDragWidgetId] = useState<string | null>(null)
	const [activeOverSlotId, setActiveOverSlotId] = useState<number | null>(null)
	const activeDragWidget = sortedWidgets.find((widget) => widget.id === activeDragWidgetId)
	const activeDragWidgetSpan = getWidgetSpan(activeDragWidget)

	const { occupiedSlots, widgetStarts } = useMemo(() => {
		const occupied = Array(GRID_SLOT_COUNT).fill(false) as boolean[]
		const starts = new Map<number, WidgetItem>()

		for (const widget of sortedWidgets) {
			const span = getWidgetSpan(widget)
			const preferred = Math.min(Math.max(widget.order ?? 0, 0), GRID_SLOT_COUNT - 1)
			const start = findAvailableStart(preferred, span, occupied)
			if (start === -1) {
				continue
			}
			starts.set(start, widget)
			for (let i = 0; i < span; i += 1) {
				occupied[start + i] = true
			}
		}

		return { occupiedSlots: occupied, widgetStarts: starts }
	}, [sortedWidgets])

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		})
	)

	const getSpanTwoPairStart = (hoveredSlot: number) => {
		const col = hoveredSlot % GRID_COLUMNS
		return col <= GRID_COLUMNS - 2 ? hoveredSlot : hoveredSlot - 1
	}

	const activeDragWidgetSlot = useMemo(() => {
		if (!activeDragWidget) return -1
		return Array.from(widgetStarts.entries()).find(
			([_, w]) => w.id === activeDragWidget.id
		)?.[0] ?? -1
	}, [activeDragWidget, widgetStarts])

	const highlightedSlots: Set<number> = useMemo(() => {
		if (activeOverSlotId === null) return new Set()
		if (activeDragWidgetSpan === 2) {
			const pairStart = getSpanTwoPairStart(activeOverSlotId)
			if (pairStart < 0) return new Set()
			return new Set([pairStart, pairStart + 1])
		}
		return new Set([activeOverSlotId])
	}, [activeDragWidgetSpan, activeOverSlotId])

	/** For each slot that holds a widget being hovered over, which direction it slides to make room */
	const displaceDirectionMap = useMemo((): Map<number, 'left' | 'right'> => {
		const map = new Map<number, 'left' | 'right'>()
		if (activeOverSlotId === null || activeDragWidgetSlot === -1) return map

		for (const slot of highlightedSlots) {
			if (!widgetStarts.has(slot)) continue
			// Target widget slides opposite to the incoming direction
			const direction = activeDragWidgetSlot <= slot ? 'right' : 'left'
			map.set(slot, direction)
		}
		return map
	}, [highlightedSlots, widgetStarts, activeDragWidgetSlot, activeOverSlotId])

	const handleDragEnd = (event: DragEndEvent) => {
		if (!canReOrderWidget) return
		const { active, over } = event
		setActiveDragWidgetId(null)
		setActiveOverSlotId(null)

		if (!over || active.id === over.id) {
			return
		}

		const overId = String(over.id)
		let targetSlot = -1

		if (overId.startsWith('slot-')) {
			const parsedSlot = Number.parseInt(overId.replace('slot-', ''), 10)
			if (!Number.isNaN(parsedSlot)) {
				targetSlot =
					activeDragWidgetSpan === 2
						? getSpanTwoPairStart(parsedSlot)
						: parsedSlot
			}
		} else {
			targetSlot =
				Array.from(widgetStarts.entries()).find(
					([_, widget]) => widget.id === over.id
				)?.[0] ?? -1
		}

		if (targetSlot !== -1) {
			setWidgetOrder(active.id as WidgetKeys, targetSlot)
		}

		Analytics.event('widget_reorder')
	}

	const handleDragStart = (event: DragStartEvent) => {
		setActiveDragWidgetId(String(event.active.id))
		setActiveOverSlotId(null)
	}

	const handleDragOver = (event: DragOverEvent) => {
		if (!event.over) {
			setActiveOverSlotId(null)
			return
		}
		const overId = String(event.over.id)
		if (overId.startsWith('slot-')) {
			const slot = Number.parseInt(overId.replace('slot-', ''), 10)
			setActiveOverSlotId(Number.isNaN(slot) ? null : slot)
		} else {
			// Hovering over another widget — resolve to its start slot
			const entry = Array.from(widgetStarts.entries()).find(([_, w]) => w.id === overId)
			setActiveOverSlotId(entry ? entry[0] : null)
		}
	}

	const handleDragCancel = (_event: DragCancelEvent) => {
		setActiveDragWidgetId(null)
		setActiveOverSlotId(null)
	}

	const layoutClasses =
		'grid w-full grid-cols-1 gap-2 transition-all duration-300 md:grid-cols-2 lg:grid-cols-4 md:gap-4'
	const gridItems: ReactNode[] = []
	for (let slotIndex = 0; slotIndex < GRID_SLOT_COUNT; slotIndex += 1) {
		const widget = widgetStarts.get(slotIndex)
		if (widget) {
			if (canReOrderWidget && totalWidgetCount > 0) {
				gridItems.push(
					<SortableWidget
						key={widget.id}
						widget={widget}
						disabled={false}
						displaceDirection={displaceDirectionMap.get(slotIndex) ?? null}
					/>
				)
			} else {
				gridItems.push(
					<div key={widget.id} className={widget.gridSpan || ''}>
						{widget.node}
					</div>
				)
			}
			continue
		}

		if (occupiedSlots[slotIndex]) {
			continue
		}

		gridItems.push(
			<EmptyGridSlot
				key={`slot-${slotIndex}`}
				slotId={`slot-${slotIndex}`}
				showDropZone={canReOrderWidget}
				isHighlighted={highlightedSlots.has(slotIndex)}
			/>
		)
	}

	return (
		<DateProvider>
			<div
				data-tour="content"
				className={`flex flex-col items-center overflow-y-auto scrollbar-none ${layoutPositions[contentAlignment]} flex-1 w-full px-1 md:px-4 py-1`}
			>

				{sortedWidgets.length > 0 && (
					<div className="w-full mt-2" id="widgets">
					<DndContext
						sensors={sensors}
						collisionDetection={canReOrderWidget ? closestCenter : undefined}
						onDragStart={canReOrderWidget ? handleDragStart : undefined}
						onDragOver={canReOrderWidget ? handleDragOver : undefined}
						onDragCancel={canReOrderWidget ? handleDragCancel : undefined}
						onDragEnd={canReOrderWidget ? handleDragEnd : undefined}
					>
						<SortableContext
							items={sortedWidgets.map((widget) => widget.id)}
						>
								<div className={layoutClasses}>{gridItems}</div>
							</SortableContext>
						</DndContext>
					</div>
				)}
			</div>
		</DateProvider>
	)
}
