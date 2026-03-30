import {
	closestCenter,
	type DragCancelEvent,
	DndContext,
	type DragEndEvent,
	type DragStartEvent,
	PointerSensor,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { type ReactNode, useMemo, useState } from 'react'
import Analytics from '@/analytics'
import { useAppearanceSetting } from '@/context/appearance.context'
import { DateProvider } from '@/context/date.context'
import { useWidgetVisibility, type WidgetItem } from '@/context/widget-visibility.context'
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
	spanClassName = '',
}: {
	slotId: string
	showDropZone: boolean
	spanClassName?: string
}) {
	const { setNodeRef, isOver } = useDroppable({ id: slotId })

	return (
		<div
			ref={setNodeRef}
			className={`min-h-[210px] md:min-h-[240px] rounded-2xl transition-all duration-200 ${spanClassName} ${showDropZone
				? `border border-dashed ${isOver ? 'border-primary bg-primary/10' : 'border-primary/20 bg-transparent'
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

function SortableWidget({ widget }: { widget: WidgetItem }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({
			id: widget.id,
			disabled: false,
		})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 999 : 'auto',
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
			className={`transition-all duration-200 ${widget.gridSpan || ''} ${isDragging
				? 'opacity-50 scale-105 shadow-2xl cursor-grabbing'
				: 'cursor-grab hover:scale-[1.02]'
				}`}
		>
			{widget.node}
		</div>
	)
}

export function ContentSection() {
	const { contentAlignment, canReOrderWidget } = useAppearanceSetting()

	const { getSortedWidgets, reorderWidgets } = useWidgetVisibility()
	const sortedWidgets = getSortedWidgets().filter((widget) => !widget.disabled)

	const totalWidgetCount = sortedWidgets.length
	const [activeDragWidgetId, setActiveDragWidgetId] = useState<string | null>(null)
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

	const handleDragEnd = (event: DragEndEvent) => {
		if (!canReOrderWidget) return
		const { active, over } = event
		setActiveDragWidgetId(null)

		if (!over || active.id === over.id) {
			return
		}

		const oldIndex = sortedWidgets.findIndex((item) => item.id === active.id)
		const overId = String(over.id)
		let newIndex = -1

		if (overId.startsWith('slot-')) {
			const parsedSlot = Number.parseInt(overId.replace('slot-', ''), 10)
			newIndex = Number.isNaN(parsedSlot) ? -1 : parsedSlot
		} else {
			newIndex =
				Array.from(widgetStarts.entries()).find(([_, widget]) => widget.id === over.id)?.[0] ??
				-1
		}

		if (oldIndex !== -1 && newIndex !== -1) {
			reorderWidgets(oldIndex, newIndex)
		}

		Analytics.event('widget_reorder')
	}

	const handleDragStart = (event: DragStartEvent) => {
		setActiveDragWidgetId(String(event.active.id))
	}

	const handleDragCancel = (_event: DragCancelEvent) => {
		setActiveDragWidgetId(null)
	}

	const layoutClasses =
		'grid w-full grid-cols-1 gap-2 transition-all duration-300 md:grid-cols-2 lg:grid-cols-4 md:gap-4'
	const gridItems: ReactNode[] = []
	for (let slotIndex = 0; slotIndex < GRID_SLOT_COUNT; slotIndex += 1) {
		const widget = widgetStarts.get(slotIndex)
		if (widget) {
			if (canReOrderWidget && totalWidgetCount > 0) {
				gridItems.push(<SortableWidget key={widget.id} widget={widget} />)
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

		const shouldRenderSpanTwoPlaceholder =
			canReOrderWidget &&
			activeDragWidgetSpan === 2 &&
			canPlaceAt(slotIndex, 2, occupiedSlots)

		if (shouldRenderSpanTwoPlaceholder) {
			gridItems.push(
				<EmptyGridSlot
					key={`slot-${slotIndex}`}
					slotId={`slot-${slotIndex}`}
					showDropZone={canReOrderWidget}
					spanClassName="md:col-span-2"
				/>
			)
			slotIndex += 1
			continue
		}

		gridItems.push(
			<EmptyGridSlot
				key={`slot-${slotIndex}`}
				slotId={`slot-${slotIndex}`}
				showDropZone={canReOrderWidget}
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
							sensors={canReOrderWidget ? sensors : []}
							collisionDetection={
								canReOrderWidget ? closestCenter : undefined
							}
							onDragStart={canReOrderWidget ? handleDragStart : undefined}
							onDragCancel={canReOrderWidget ? handleDragCancel : undefined}
							onDragEnd={canReOrderWidget ? handleDragEnd : undefined}
						>
							<SortableContext
								items={sortedWidgets.map((widget) => widget.id)}
								strategy={rectSortingStrategy}
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
