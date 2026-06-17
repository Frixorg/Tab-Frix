import type { PoolClient } from 'pg'
import { pool } from './pool'
import type { Calendar, FetchedAllEvents, FetchedEvent } from '../types'
import { EMPTY_EVENTS } from '../types'

interface EventRow {
	calendar: Calendar
	title: string
	month: number
	day: number
	isHoliday: boolean
	icon: string | null
}

// Read every stored event, grouped into the three calendar buckets.
export async function getAllEvents(): Promise<FetchedAllEvents> {
	const { rows } = await pool.query<EventRow>(
		`SELECT calendar, title, month, day, is_holiday AS "isHoliday", icon
		 FROM events
		 ORDER BY month, day, title`
	)

	const out: FetchedAllEvents = {
		shamsiEvents: [],
		gregorianEvents: [],
		hijriEvents: [],
	}

	for (const r of rows) {
		const event: FetchedEvent = {
			isHoliday: r.isHoliday,
			title: r.title,
			day: r.day,
			month: r.month,
			icon: r.icon,
		}
		if (r.calendar === 'shamsi') out.shamsiEvents.push(event)
		else if (r.calendar === 'gregorian') out.gregorianEvents.push(event)
		else if (r.calendar === 'hijri') out.hijriEvents.push(event)
	}

	return out
}

export interface ReplaceCounts {
	shamsi: number
	gregorian: number
	hijri: number
}

// Replace the whole events snapshot transactionally. The upstream feed is a full
// snapshot, so we wipe and re-insert inside one transaction (all-or-nothing).
export async function replaceAllEvents(
	data: FetchedAllEvents
): Promise<ReplaceCounts> {
	const client: PoolClient = await pool.connect()
	try {
		await client.query('BEGIN')
		await client.query('DELETE FROM events')

		const groups: Array<[Calendar, FetchedEvent[]]> = [
			['shamsi', data.shamsiEvents ?? []],
			['gregorian', data.gregorianEvents ?? []],
			['hijri', data.hijriEvents ?? []],
		]

		for (const [calendar, list] of groups) {
			for (const e of list) {
				await client.query(
					`INSERT INTO events (calendar, title, month, day, is_holiday, icon)
					 VALUES ($1, $2, $3, $4, $5, $6)
					 ON CONFLICT (calendar, month, day, title)
					 DO UPDATE SET is_holiday = EXCLUDED.is_holiday,
					               icon = EXCLUDED.icon,
					               updated_at = now()`,
					[calendar, e.title, e.month, e.day, !!e.isHoliday, e.icon ?? null]
				)
			}
		}

		await client.query('COMMIT')
		return {
			shamsi: data.shamsiEvents?.length ?? 0,
			gregorian: data.gregorianEvents?.length ?? 0,
			hijri: data.hijriEvents?.length ?? 0,
		}
	} catch (err) {
		await client.query('ROLLBACK')
		throw err
	} finally {
		client.release()
	}
}

export async function countEvents(): Promise<number> {
	const { rows } = await pool.query<{ c: number }>(
		'SELECT COUNT(*)::int AS c FROM events'
	)
	return rows[0]?.c ?? 0
}

export interface CrawlRun {
	started_at: string
	finished_at: string | null
	ok: boolean | null
	shamsi_count: number
	gregorian_count: number
	hijri_count: number
	error: string | null
}

export async function getLastCrawl(): Promise<CrawlRun | null> {
	const { rows } = await pool.query<CrawlRun>(
		`SELECT started_at, finished_at, ok, shamsi_count, gregorian_count, hijri_count, error
		 FROM crawl_runs ORDER BY id DESC LIMIT 1`
	)
	return rows[0] ?? null
}

// Returns empty buckets — handy as a typed fallback.
export function emptyEvents(): FetchedAllEvents {
	return { ...EMPTY_EVENTS, shamsiEvents: [], gregorianEvents: [], hijriEvents: [] }
}
