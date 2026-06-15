import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
const LAYOUT_VERSION = 6

const DASHBOARD_STYLES = `
.tf-dash { position: relative; }
.tf-dash .react-grid-layout { position: relative; z-index: 1; }
.tf-dash .react-grid-item.react-grid-placeholder {
	background: rgba(var(--primary-rgb, 99 102 241), 0.25);
	border: 2px dashed rgba(var(--primary-rgb, 99 102 241), 0.7);
	border-radius: 1rem;
	opacity: 1;
}
.tf-slot {
	border: 2px dashed rgba(128, 128, 128, 0.35);
	background: rgba(128, 128, 128, 0.06);
	border-radius: 1rem;
}
.tf-dash .react-grid-item > .tf-cell {
	width: 100%;
	height: 100%;
	overflow: auto;
}
.tf-dash.reordering .react-grid-item > .tf-cell {
	pointer-events: none;
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
	const [layoutsState, setLayoutsState] = useState<GridLayouts>({})
	const [ready, setReady] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const [rowHeight, setRowHeight] = useState(GRID_ROW_HEIGHT)

	// Size the grid so 3 rows (MAX_ROWS height-units) fill the visible area -> big cells.
	useEffect(() => {
		const compute = () => {
			const h = containerRef.current?.clientHeight ?? 0
			if (h > 0) {
				const rh = Math.max(
					48,
					Math.floor((h - (MAX_ROWS + 1) * GRID_MARGIN[1]) / MAX_ROWS)
				)
				setRowHeight(rh)
			}
		}
		compute()
		window.addEventListener('resize', compute)
		return () => window.removeEventListener('resize', compute)
	}, [])

	// Load stored layouts or build defaults on mount and when cellIds change (widgets toggled)
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

	// Store layout updates in ref during active drag/resize so they are not reset,
	// but do NOT trigger React re-renders mid-operation.
	const onLayoutChange = useCallback(
		(_current: unknown, allLayouts: GridLayouts) => {
			layoutsRef.current = allLayouts
		},
		[]
	)

	// Persist to storage and update React state ONLY when dragging or resizing stops.
	// This prevents RGL from glitching/re-syncing mid-drag and widgets disappearing.
	const onDragStop = useCallback(() => {
		if (!canReOrderWidget) return
		const clamped = buildLayouts(cellIds, layoutsRef.current)
		layoutsRef.current = clamped
		setToStorage('dashboardLayout', { version: LAYOUT_VERSION, layouts: clamped })
		setLayoutsState(clamped)
	}, [cellIds, canReOrderWidget])

	const onResizeStop = useCallback(() => {
		if (!canReOrderWidget) return
		const clamped = buildLayouts(cellIds, layoutsRef.current)
		layoutsRef.current = clamped
		setToStorage('dashboardLayout', { version: LAYOUT_VERSION, layouts: clamped })
		setLayoutsState(clamped)
	}, [cellIds, canReOrderWidget])

	if (!ready) return null

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
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								display: 'grid',
								gridTemplateColumns: `repeat(${GRID_COLS.lg}, 1fr)`,
								gridAutoRows: `${ROW_UNITS * rowHeight + (ROW_UNITS - 1) * GRID_MARGIN[1]}px`,
								gap: `${GRID_MARGIN[1]}px ${GRID_MARGIN[0]}px`,
								padding: `${GRID_MARGIN[1]}px ${GRID_MARGIN[0]}px`,
								pointerEvents: 'none',
								zIndex: 0,
							}}
						>
							{Array.from({ length: GRID_ROWS * GRID_COLS.lg }).map((_, i) => (
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
						maxRows={MAX_ROWS}
						margin={GRID_MARGIN}
						isDraggable={canReOrderWidget}
						isResizable={canReOrderWidget}
						isBounded={true}
						preventCollision={true}
						compactType={null}
						resizeHandles={['se']}
						draggableCancel="input, textarea, button, a, select, [contenteditable='true']"
						onLayoutChange={onLayoutChange as any}
						onDragStop={onDragStop}
						onResizeStop={onResizeStop}
					>
						{cellIds.map((id) => (
							<div key={id}>
								<div className="tf-cell" dir={dir}>{renderCell(id)}</div>
							</div>
						))}
					</ResponsiveGridLayout>
				</div>
			</div>
		</DateProvider>
	)
}
