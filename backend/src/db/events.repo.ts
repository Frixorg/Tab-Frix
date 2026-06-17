import type { PoolClient } from 'pg'
import { pool } from './pool'
import type { Calendar, FetchedAllEvents, FetchedEvent } from '../types'
import type { Lang } from '../lang'

export interface StoredEvent {
	calendar: Calendar
	title: string // Persian (normalized) — the canonical title
	titleEn: string | null
	titleIt: string | null
	month: number
	day: number
	isHoliday: boolean
	icon: string | null
}

export interface ReplaceCounts {
	shamsi: number
	gregorian: number
	hijri: number
}

// Replace the whole events snapshot transactionally (the upstream feed is a full
// snapshot). Stores Persian + English/Italian titles.
export async function replaceAllEvents(events: StoredEvent[]): Promise<ReplaceCounts> {
	const client: PoolClient = await pool.connect()
	try {
		await client.query('BEGIN')
		await client.query('DELETE FROM events')
		const counts: ReplaceCounts = { shamsi: 0, gregorian: 0, hijri: 0 }
		for (const e of events) {
			await client.query(
				`INSERT INTO events (calendar, title, title_en, title_it, month, day, is_holiday, icon)
				 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				 ON CONFLICT (calendar, month, day, title) DO UPDATE
				   SET title_en = EXCLUDED.title_en, title_it = EXCLUDED.title_it,
				       is_holiday = EXCLUDED.is_holiday, icon = EXCLUDED.icon, updated_at = now()`,
				[e.calendar, e.title, e.titleEn, e.titleIt, e.month, e.day, e.isHoliday, e.icon]
			)
			if (e.calendar === 'shamsi') counts.shamsi++
			else if (e.calendar === 'gregorian') counts.gregorian++
			else counts.hijri++
		}
		await client.query('COMMIT')
		return counts
	} catch (err) {
		await client.query('ROLLBACK')
		throw err
	} finally {
		client.release()
	}
}

// Read every stored event with the title in the requested language (fa fallback).
export async function getAllEvents(lang: Lang = 'fa'): Promise<FetchedAllEvents> {
	const titleExpr =
		lang === 'en'
			? "CASE WHEN title_en IS NULL OR title_en = '' THEN title ELSE title_en END"
			: lang === 'it'
				? "CASE WHEN title_it IS NULL OR title_it = '' THEN title ELSE title_it END"
				: 'title'

	const { rows } = await pool.query<{
		calendar: Calendar
		title: string
		month: number
		day: number
		isHoliday: boolean
		icon: string | null
	}>(
		`SELECT calendar, ${titleExpr} AS title, month, day, is_holiday AS "isHoliday", icon
		 FROM events
		 ORDER BY month, day`
	)

	const out: FetchedAllEvents = { shamsiEvents: [], gregorianEvents: [], hijriEvents: [] }
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
