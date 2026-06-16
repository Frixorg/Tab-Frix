import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout/legacy'
import { getFromStorage, setToStorage } from '@/common/storage'
import { useAppearanceSetting } from '@/context/appearance.context'
import { DateProvider } from '@/context/date.context'
import { useWidgetVisibility } from '@/context/widget-visibility.context'
import { useLanguage } from '@/context/language.context'
import { BookmarksList } from '@/layouts/bookmark/bookmarks'
import { BookmarkProvider } from '@/layouts/bookmark/context/bookmark.context'
import { SearchLayout } from '@/layouts/search/search'
import { WidgetifyLayout } from '@/layouts/widgetify-card/widgetify.layout'
import { WigiPadWidget } from '@/layouts/widgets/wigiPad/wigiPad.layout'
import {
	buildLayouts,
	GRID_BREAKPOINTS,
	GRID_COLS,
	GRID_MARGIN,
	GRID_ROW_HEIGHT,
	GRID_ROWS,
	type GridLayouts,
	MAX_ROWS,
	orderedCellIds,
	ROW_UNITS,
} from './dashboard-layout'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Bump to discard layouts saved by older, buggy versions and rebuild clean defaults.
const LAYOUT_VERSION = 7

const BP_ORDER = ['lg', 'md', 'sm', 'xs'] as const
type BP = (typeof BP_ORDER)[number]

const DASHBOARD_STYLES = `
.tf-dash { position: relative; }
.tf-dash .react-grid-layout { position: relative; z-index: 1; }
.tf-dash .react-grid-item > .tf-cell {
	width: 100%;
	height: 100%;
	overflow: auto;
	border-radius: 1rem;
}

/* Faint guide showing every spot a widget can snap into (reorder mode only). */
.tf-slot-layer { position: absolute; top: 0; left: 0; right: 0; z-index: 0; pointer-events: none; }
.tf-slot {
	border: 1.5px dashed rgba(var(--brand-primary-rgb, 83, 109, 254), 0.22);
	background: rgba(var(--brand-primary-rgb, 83, 109, 254), 0.05);
	border-radius: 1rem;
}

/* Drop-target preview shown while dragging / resizing. */
.tf-dash .react-grid-item.react-grid-placeholder {
	background: rgba(var(--brand-primary-rgb, 83, 109, 254), 0.25);
	border: 2px dashed rgba(var(--brand-primary-rgb, 83, 109, 254), 0.9);
	border-radius: 1.25rem;
	opacity: 1;
	transition: transform 120ms ease, left 120ms ease, top 120ms ease;
}

/* ---------- Reorder (edit) mode ---------- */
.tf-dash.reordering .react-grid-item {
	will-change: transform;
	cursor: grab;
}
/* Make the whole tile a drag surface (content stays inert while arranging). */
.tf-dash.reordering .react-grid-item > .tf-cell {
	pointer-events: none;
	user-select: none;
}
/* The tile currently being dragged: lift it for a clear "picked up" feel. */
.tf-dash .react-grid-item.react-draggable-dragging {
	z-index: 5;
	cursor: grabbing;
	box-shadow: 0 24px 60px -16px rgba(0, 0, 0, 0.45);
}
/* The glass theme paints a 16px backdrop-blur on every card. Re-sampling that blur
   on each animation frame is what makes dragging stutter. Turn it off (and make the
   cards opaque) only while reordering so motion stays at 60fps. */
[data-theme="glass"] .tf-dash.reordering .bg-glass,
[data-theme="glass"] .tf-dash.reordering .widget-wrapper,
[data-theme="glass"] .tf-dash.reordering .search-box {
	-webkit-backdrop-filter: none !important;
	backdrop-filter: none !important;
	background-color: #171717 !important;
}
`

export function WidgetDashboard() {
	const { canReOrderWidget } = useAppearanceSetting()
	const { dir } = useLanguage()
	const { getSortedWidgets } = useWidgetVisibility()

	const widgets = getSortedWidgets().filter((w) => !w.disabled)
	const widgetIds = widgets.map((w) => w.id)
	const cellIds = orderedCellIds(widgetIds)
	const cellKey = cellIds.join('|')

	const layoutsRef = useRef<GridLayouts>({})
	const interactingRef = useRef(false)
	const [layoutsState, setLayoutsState] = useState<GridLayouts>({})
	const [ready, setReady] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const [rowHeight, setRowHeight] = useState(GRID_ROW_HEIGHT)
	const [bp, setBp] = useState<BP>('lg')

	// Size rows so the default grid (MAX_ROWS height-units) fills the visible area -> big
	// cells, and track the active breakpoint so the slot guide matches the real columns.
	useEffect(() => {
		const compute = () => {
			const el = containerRef.current
			if (!el) return
			const h = el.clientHeight
			if (h > 0) {
				const rh = Math.max(
					48,
					Math.floor((h - (MAX_ROWS + 1) * GRID_MARGIN[1]) / MAX_ROWS)
				)
				setRowHeight(rh)
			}
			const w = el.clientWidth
			let next: BP = 'xs'
			for (const b of BP_ORDER) {
				if (w >= GRID_BREAKPOINTS[b]) {
					next = b
					break
				}
			}
			setBp(next)
		}
		compute()
		window.addEventListener('resize', compute)
		return () => window.removeEventListener('resize', compute)
	}, [])

	// Load stored layout (or build defaults) on mount and whenever the set of cells changes.
	useEffect(() => {
		if (ready) {
			setLayoutsState(buildLayouts(cellIds, layoutsRef.current))
		} else {
			getFromStorage('dashboardLayout').then((stored) => {
				const loaded: GridLayouts =
					stored && stored.version === LAYOUT_VERSION ? stored.layouts : {}
				layoutsRef.current = loaded
				setLayoutsState(buildLayouts(cellIds, loaded))
				setReady(true)
			})
		}
	}, [cellKey])

	const startInteract = useCallback(() => {
		interactingRef.current = true
	}, [])

	// Fallback: if a gesture ended without moving anything (no layout change fired),
	// clear the flag on the next frame so it can't leak into a later resize event.
	const endInteract = useCallback(() => {
		requestAnimationFrame(() => {
			interactingRef.current = false
		})
	}, [])

	// react-grid-layout reports the authoritative final layout here (it does NOT fire
	// mid-drag). Committing straight from this argument — instead of a ref read in
	// onDragStop — is what guarantees a drop lands where the placeholder showed, so
	// widgets never snap back to their old spot.
	const onLayoutChange = useCallback(
		(_current: unknown, allLayouts: GridLayouts) => {
			layoutsRef.current = allLayouts
			if (!interactingRef.current) return
			interactingRef.current = false
			const next = buildLayouts(cellIds, allLayouts)
			layoutsRef.current = next
			setToStorage('dashboardLayout', { version: LAYOUT_VERSION, layouts: next })
			setLayoutsState(next)
		},
		[cellIds]
	)

	const renderCell = (id: string) => {
		switch (id) {
			case 'search':
				return <SearchLayout />
			case 'bookmarks':
				return (
					<BookmarkProvider>
						<BookmarksList />
					</BookmarkProvider>
				)
			case 'widgetifyCard':
				return <WidgetifyLayout />
			case 'wigiPad':
				return <WigiPadWidget />
			default:
				return widgets.find((w) => w.id === id)?.node ?? null
		}
	}

	if (!ready) return null

	const cols = GRID_COLS[bp]
	const bpLayout = layoutsState[bp] ?? layoutsState.lg ?? []
	const maxBottomUnits = bpLayout.reduce((m, c) => Math.max(m, c.y + c.h), 0)
	const slotRows = Math.max(GRID_ROWS, Math.ceil(maxBottomUnits / ROW_UNITS))
	const slotHeight = ROW_UNITS * rowHeight + (ROW_UNITS - 1) * GRID_MARGIN[1]

	return (
		<DateProvider>
			<style>{DASHBOARD_STYLES}</style>
			<div
				ref={containerRef}
				data-tour="content"
				className="flex-1 w-full px-1 py-1 overflow-y-auto overflow-x-hidden scrollbar-none md:px-4"
			>
				<div dir="ltr" className={`tf-dash ${canReOrderWidget ? 'reordering' : ''}`}>
					{canReOrderWidget && (
						<div
							aria-hidden
							className="tf-slot-layer"
							style={{
								display: 'grid',
								gridTemplateColumns: `repeat(${cols}, 1fr)`,
								gridAutoRows: `${slotHeight}px`,
								gap: `${GRID_MARGIN[1]}px ${GRID_MARGIN[0]}px`,
								padding: `${GRID_MARGIN[1]}px ${GRID_MARGIN[0]}px`,
							}}
						>
							{Array.from({ length: slotRows * cols }).map((_, i) => (
								<div key={i} className="tf-slot" />
							))}
						</div>
					)}
					<ResponsiveGridLayout
						className="layout"
						layouts={layoutsState as any}
						breakpoints={GRID_BREAKPOINTS as any}
						cols={GRID_COLS as any}
						rowHeight={rowHeight}
						margin={GRID_MARGIN}
						isDraggable={canReOrderWidget}
						isResizable={canReOrderWidget}
						isBounded={false}
						preventCollision={false}
						compactType={null}
						useCSSTransforms={true}
						resizeHandles={['se']}
						draggableCancel="input, textarea, button, a, select, [contenteditable='true']"
						onDragStart={startInteract}
						onResizeStart={startInteract}
						onDragStop={endInteract}
						onResizeStop={endInteract}
						onLayoutChange={onLayoutChange as any}
					>
						{cellIds.map((id) => (
							<div key={id}>
								<div className="tf-cell" dir={dir}>
									{renderCell(id)}
								</div>
							</div>
						))}
					</ResponsiveGridLayout>
				</div>
			</div>
		</DateProvider>
	)
}
