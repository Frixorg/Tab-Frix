import { config } from '../config'
import { pool } from '../db/pool'
import { replaceAllEvents, type ReplaceCounts } from '../db/events.repo'
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

// Fetch the upstream events feed and coerce it into our contract. Accepts both a
// bare `{ shamsiEvents, ... }` body and a `{ data: { ... } }` wrapper.
export async function fetchUpstreamEvents(): Promise<FetchedAllEvents> {
	const url = `${config.upstreamUrl}/date/events`
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), config.upstreamTimeoutMs)
	try {
		const res = await fetch(url, {
			headers: {
				client: config.clientHeader,
				accept: 'application/json',
			},
			signal: controller.signal,
		})
		if (!res.ok) {
			throw new Error(`upstream responded ${res.status} ${res.statusText}`)
		}
		const body = (await res.json()) as Record<string, unknown>
		const hasTop =
			body && (body.shamsiEvents || body.gregorianEvents || body.hijriEvents)
		const root = (hasTop ? body : (body?.data ?? body)) as Record<string, unknown>
		return {
			shamsiEvents: sanitizeList(root?.shamsiEvents),
			gregorianEvents: sanitizeList(root?.gregorianEvents),
			hijriEvents: sanitizeList(root?.hijriEvents),
		}
	} finally {
		clearTimeout(timer)
	}
}

export interface CrawlResult extends ReplaceCounts {
	ok: boolean
}

// One full crawl: fetch upstream -> replace snapshot -> log the run.
export async function crawl(): Promise<CrawlResult> {
	const { rows } = await pool.query<{ id: number }>(
		'INSERT INTO crawl_runs (started_at) VALUES (now()) RETURNING id'
	)
	const runId = rows[0].id
	try {
		const data = await fetchUpstreamEvents()
		const counts = await replaceAllEvents(data)
		await pool.query(
			`UPDATE crawl_runs
			 SET finished_at = now(), ok = true,
			     shamsi_count = $2, gregorian_count = $3, hijri_count = $4
			 WHERE id = $1`,
			[runId, counts.shamsi, counts.gregorian, counts.hijri]
		)
		console.log(
			`[crawl] ok — shamsi=${counts.shamsi} gregorian=${counts.gregorian} hijri=${counts.hijri}`
		)
		return { ok: true, ...counts }
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		await pool.query(
			'UPDATE crawl_runs SET finished_at = now(), ok = false, error = $2 WHERE id = $1',
			[runId, message]
		)
		console.error('[crawl] failed —', message)
		throw err
	}
}
