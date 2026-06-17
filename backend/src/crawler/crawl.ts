import { config } from '../config'
import { pool } from '../db/pool'
import { replaceAllEvents, type ReplaceCounts } from '../db/events.repo'
import { putSnapshot } from '../db/snapshots.repo'
import type { FetchedAllEvents, FetchedEvent } from '../types'

// Defensive normalisation: drop anything that isn't a usable event so a bad
// upstream payload can never poison the database.
function sanitizeList(list: unknown): FetchedEvent[] {
	if (!Array.isArray(list)) return []
	const out: FetchedEvent[] = []
	for (const raw of list) {
		const e = raw as Record<string, unknown>
		const day = Number(e?.day)
		const month = Number(e?.month)
		if (!Number.isInteger(day) || !Number.isInteger(month)) continue
		if (month < 1 || month > 12 || day < 1 || day > 31) continue
		const title = typeof e?.title === 'string' ? e.title.trim() : ''
		if (!title) continue
		const icon = typeof e?.icon === 'string' && e.icon.length > 0 ? e.icon : null
		out.push({ isHoliday: Boolean(e?.isHoliday), title, day, month, icon })
	}
	return out
}

// Generic upstream JSON GET with the client header and a timeout.
async function fetchUpstreamJson<T = unknown>(
	path: string,
	params?: Record<string, string | number>
): Promise<T> {
	let qs = ''
	if (params) {
		const sp = new URLSearchParams()
		for (const [k, v] of Object.entries(params)) sp.set(k, String(v))
		qs = '?' + sp.toString()
	}
	const url = `${config.upstreamUrl}${path}${qs}`
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs)
	try {
		const res = await fetch(url, {
			headers: { client: config.clientHeader, accept: 'application/json' },
			signal: controller.signal,
		})
		if (!res.ok) {
			throw new Error(`upstream ${path} responded ${res.status} ${res.statusText}`)
		}
		return (await res.json()) as T
	} finally {
		clearTimeout(timer)
	}
}

// Fetch + coerce the events feed. Accepts a bare body or a { data: {...} } wrapper.
export async function fetchUpstreamEvents(): Promise<FetchedAllEvents> {
	const body = await fetchUpstreamJson<Record<string, unknown>>('/date/events')
	const hasTop =
		body && (body.shamsiEvents || body.gregorianEvents || body.hijriEvents)
	const root = (hasTop ? body : ((body as { data?: unknown })?.data ?? body)) as Record<
		string,
		unknown
	>
	return {
		shamsiEvents: sanitizeList(root?.shamsiEvents),
		gregorianEvents: sanitizeList(root?.gregorianEvents),
		hijriEvents: sanitizeList(root?.hijriEvents),
	}
}

// Fetch the global searchbox payload (search engines + recommended sites). We
// store it verbatim — the extension reads its own selected_engine from storage.
export async function fetchUpstreamSearchbox(): Promise<unknown> {
	return fetchUpstreamJson('/searchbox', {
		region: config.searchboxRegion,
		limit: config.searchboxLimit,
	})
}

export interface CrawlResult {
	ok: boolean
	events: ReplaceCounts
	searchbox: boolean
	errors: string[]
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

// One crawl pass. Events and searchbox are fetched independently so a failure
// in one never blocks the other. Throws only if BOTH fail (so the CLI exits non-zero).
export async function crawl(): Promise<CrawlResult> {
	const { rows } = await pool.query<{ id: number }>(
		'INSERT INTO crawl_runs (started_at) VALUES (now()) RETURNING id'
	)
	const runId = rows[0].id

	const errors: string[] = []
	let events: ReplaceCounts = { shamsi: 0, gregorian: 0, hijri: 0 }
	let eventsOk = false
	let searchboxOk = false

	try {
		events = await replaceAllEvents(await fetchUpstreamEvents())
		eventsOk = true
		console.log(
			`[crawl] events ok — shamsi=${events.shamsi} gregorian=${events.gregorian} hijri=${events.hijri}`
		)
	} catch (err) {
		errors.push(`events: ${msg(err)}`)
		console.error('[crawl] events failed —', msg(err))
	}

	try {
		await putSnapshot('searchbox', await fetchUpstreamSearchbox())
		searchboxOk = true
		console.log('[crawl] searchbox ok')
	} catch (err) {
		errors.push(`searchbox: ${msg(err)}`)
		console.error('[crawl] searchbox failed —', msg(err))
	}

	const ok = eventsOk && searchboxOk
	await pool.query(
		`UPDATE crawl_runs
		 SET finished_at = now(), ok = $2,
		     shamsi_count = $3, gregorian_count = $4, hijri_count = $5, error = $6
		 WHERE id = $1`,
		[runId, ok, events.shamsi, events.gregorian, events.hijri, errors.length ? errors.join('; ') : null]
	)

	if (!eventsOk && !searchboxOk) throw new Error(errors.join('; ') || 'crawl failed')
	return { ok, events, searchbox: searchboxOk, errors }
}
