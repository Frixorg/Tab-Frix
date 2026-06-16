// Layout model for the draggable/resizable widget dashboard (react-grid-layout based).
// The grid is 4 columns on desktop. Each cell has { i, x, y, w, h } in grid units,
// plus min/max width & height so resizing stays within sensible bounds.

export type GridCell = {
	i: string
	x: number
	y: number
	w: number
	h: number
	minW?: number
	maxW?: number
	minH?: number
	maxH?: number
}
export type GridLayouts = Record<string, GridCell[]>

// Responsive column counts and breakpoints (px) for react-grid-layout.
export const GRID_COLS = { lg: 4, md: 2, sm: 1, xs: 1 } as const
export const GRID_BREAKPOINTS = { lg: 760, md: 480, sm: 320, xs: 0 } as const
export const GRID_ROW_HEIGHT = 150
// Fixed grid: 4 columns x 3 rows. Each widget row spans ROW_UNITS height-units.
export const GRID_ROWS = 3
export const ROW_UNITS = 2
export const MAX_ROWS = GRID_ROWS * ROW_UNITS
export const GRID_MARGIN: [number, number] = [16, 16]

// Non-widget cells that also live in the unified dashboard.
export const FIXED_CELL_IDS = ['search', 'bookmarks', 'wigiPad'] as const

// Default size (in grid units) per cell. Widgets fall back to WIDGET_SIZE.
const DEFAULT_SIZE: Record<string, { w: number; h: number }> = {
	search: { w: 2, h: 2 },
}
// Default for every non-search cell: 1 column wide, 2 rows tall.
const WIDGET_SIZE = { w: 1, h: 2 }

// Resize bounds (grid units) per cell. Widgets fall back to WIDGET_CONSTRAINT.
type Constraint = { minW: number; maxW: number; minH: number; maxH: number }
const CONSTRAINTS: Record<string, Constraint> = {
	search: { minW: 2, maxW: 4, minH: 1, maxH: 4 },
}
const WIDGET_CONSTRAINT: Constraint = { minW: 1, maxW: 4, minH: 1, maxH: 6 }

function constraintFor(id: string): Constraint {
	return CONSTRAINTS[id] ?? WIDGET_CONSTRAINT
}
function sizeFor(id: string) {
	return DEFAULT_SIZE[id] ?? WIDGET_SIZE
}
function clamp(v: number, min: number, max: number) {
	return Math.min(Math.max(v, min), max)
}

/** Attach constraints to a cell and clamp its width/height/x-position into range, accounting for grid column limit. */
function withConstraints(cell: GridCell, cols: number): GridCell {
	const c = constraintFor(cell.i)
	const minW = Math.min(c.minW, cols)
	const maxW = Math.min(c.maxW, cols)
	const minH = c.minH
	const maxH = c.maxH
	const w = clamp(cell.w, minW, maxW)
	const h = clamp(cell.h, minH, maxH)
	const x = clamp(cell.x, 0, Math.max(0, cols - w))
	return {
		...cell,
		minW,
		maxW,
		minH,
		maxH,
		x,
		w,
		h,
	}
}

/** Cells are driven entirely by widget visibility now (search/bookmarks/wigiPad are
 *  toggleable widgets too), so pass the visible widget ids straight through. */
export function orderedCellIds(widgetIds: string[]): string[] {
	return [...widgetIds]
}

/** Shelf-pack ids into a grid of specified column width to produce a sensible default layout. */
export function packLayout(ids: string[], cols: number = GRID_COLS.lg): GridCell[] {
	let x = 0
	let y = 0
	let shelfHeight = 0
	const cells: GridCell[] = []
	for (const id of ids) {
		const { w, h } = sizeFor(id)
		const cw = Math.min(w, cols)
		if (x + cw > cols) {
			y += shelfHeight
			x = 0
			shelfHeight = 0
		}
		cells.push(withConstraints({ i: id, x, y, w: cw, h }, cols))
		x += cw
		shelfHeight = Math.max(shelfHeight, h)
	}
	return cells
}

// Default 4-column top band:
//   col0    = wigiPad (h2, left)
//   cols1-2 = search (h1) over bookmarks (h1) in the middle
//   col3    = calendar (h2, right)
//   remaining widgets fill the rows beneath, left-to-right.
const DEFAULT_POSITIONS: Record<string, { x: number; y: number; w: number; h: number }> = {
	wigiPad: { x: 0, y: 0, w: 1, h: 2 },
	search: { x: 1, y: 0, w: 2, h: 1 },
	bookmarks: { x: 1, y: 1, w: 2, h: 1 },
	calendar: { x: 3, y: 0, w: 1, h: 2 },
}

function defaultLgLayout(ids: string[]): GridCell[] {
	const cols = GRID_COLS.lg
	const cells: GridCell[] = []
	for (const id of ['wigiPad', 'search', 'bookmarks', 'calendar']) {
		if (ids.includes(id) && DEFAULT_POSITIONS[id]) {
			cells.push(withConstraints({ i: id, ...DEFAULT_POSITIONS[id] }, cols))
		}
	}
	// widgets flow beneath the top band (left-to-right), each 1 col x 2 rows
	const widgetIds = ids.filter((id) => !DEFAULT_POSITIONS[id])
	let x = 0
	let y = 2
	for (const id of widgetIds) {
		if (x >= cols) {
			x = 0
			y += 2
		}
		cells.push(withConstraints({ i: id, x, y, w: 1, h: 2 }, cols))
		x += 1
	}
	return cells
}

/**
 * Build the react-grid-layout `layouts` object: keep saved positions for cells
 * that still exist (with constraints re-applied), and append defaults for new cells.
 * Ensure all breakpoints have correct, constrained layout items.
 */
export function buildLayouts(ids: string[], saved: GridLayouts): GridLayouts {
	const idSet = new Set(ids)
	const result: GridLayouts = {} as GridLayouts

	for (const bp of ['lg', 'md', 'sm', 'xs'] as const) {
		const cols = GRID_COLS[bp]
		const defaults = bp === 'lg' ? defaultLgLayout(ids) : packLayout(ids, cols)

		const savedBp = (saved.lg || saved[bp] ? (saved[bp] ?? []) : [])
			.filter((c) => idSet.has(c.i))
			.map((c) => withConstraints(c, cols))

		const savedIds = new Set(savedBp.map((c) => c.i))
		result[bp] = [...savedBp, ...defaults.filter((c) => !savedIds.has(c.i))]
	}

	return result
}
