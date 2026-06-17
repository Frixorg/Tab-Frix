import { config } from '../config'
import { pool } from '../db/pool'
import { replaceAllEvents, type ReplaceCounts, type StoredEvent } from '../db/events.repo'
import { putSnapshot } from '../db/snapshots.repo'
import { normalizeFa, translateTexts } from '../translate/llm'
import type { Translation } from '../db/translations.repo'
import type { Calendar, FetchedAllEvents, FetchedEvent } from '../types'
import type { Lang } from '../lang'

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
		if (!res.ok) throw new Error(`upstream ${path} responded ${res.status} ${res.statusText}`)
		return (await res.json()) as T
	} finally {
		clearTimeout(timer)
	}
}

export async function fetchUpstreamEvents(): Promise<FetchedAllEvents> {
	const body = await fetchUpstreamJson<Record<string, unknown>>('/date/events')
	const hasTop = body && (body.shamsiEvents || body.gregorianEvents || body.hijriEvents)
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

interface SearchEngine {
	label?: unknown
	[k: string]: unknown
}
interface RecSite {
	title?: unknown
	[k: string]: unknown
}
interface Searchbox {
	search_engines?: SearchEngine[]
	recommendedSites?: RecSite[]
	[k: string]: unknown
}

export async function fetchUpstreamSearchbox(): Promise<Searchbox> {
	return fetchUpstreamJson<Searchbox>('/searchbox', {
		region: config.searchboxRegion,
		limit: config.searchboxLimit,
	})
}

// Produce a localized copy of the searchbox payload. fa = normalized Persian;
// en/it = translated label/title (falling back to the original string).
function localizeSearchbox(
	raw: Searchbox,
	map: Map<string, Translation>,
	lang: Lang
): Searchbox {
	const tr = (s: string): string => {
		if (lang === 'fa') return normalizeFa(s)
		const t = map.get(normalizeFa(s))
		return (lang === 'en' ? t?.en : t?.it) || s
	}
	const engines = Array.isArray(raw.search_engines) ? raw.search_engines : []
	const sites = Array.isArray(raw.recommendedSites) ? raw.recommendedSites : []
	return {
		...raw,
		search_engines: engines.map((e) => ({
			...e,
			label: typeof e.label === 'string' ? tr(e.label) : e.label,
		})),
		recommendedSites: sites.map((s) => ({
			...s,
			title: typeof s.title === 'string' ? tr(s.title) : s.title,
		})),
	}
}

export interface CrawlResult {
	ok: boolean
	events: ReplaceCounts
	searchbox: boolean
	errors: string[]
}

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e))

export async function crawl(): Promise<CrawlResult> {
	const { rows } = await pool.query<{ id: number }>(
		'INSERT INTO crawl_runs (started_at) VALUES (now()) RETURNING id'
	)
	const runId = rows[0].id
	const errors: string[] = []

	let ev: FetchedAllEvents | null = null
	let sb: Searchbox | null = null
	try {
		ev = await fetchUpstreamEvents()
	} catch (err) {
		errors.push(`events: ${msg(err)}`)
	}
	try {
		sb = await fetchUpstreamSearchbox()
	} catch (err) {
		errors.push(`searchbox: ${msg(err)}`)
	}

	// Collect every Persian source string and translate once (cached + batched).
	const texts: string[] = []
	if (ev)
		for (const arr of [ev.shamsiEvents, ev.gregorianEvents, ev.hijriEvents])
			for (const e of arr) texts.push(e.title)
	if (sb) {
		for (const e of Array.isArray(sb.search_engines) ? sb.search_engines : [])
			if (typeof e.label === 'string') texts.push(e.label)
		for (const s of Array.isArray(sb.recommendedSites) ? sb.recommendedSites : [])
			if (typeof s.title === 'string') texts.push(s.title)
	}
	let map = new Map<string, Translation>()
	try {
		map = await translateTexts(texts)
	} catch (err) {
		errors.push(`translate: ${msg(err)}`)
	}

	let counts: ReplaceCounts = { shamsi: 0, gregorian: 0, hijri: 0 }
	let eventsOk = false
	let searchboxOk = false

	if (ev) {
		try {
			const stored: StoredEvent[] = []
			const add = (calendar: Calendar, arr: FetchedEvent[]) => {
				for (const e of arr) {
					const t = map.get(normalizeFa(e.title)) ?? { en: null, it: null }
					stored.push({
						calendar,
						title: normalizeFa(e.title),
						titleEn: t.en,
						titleIt: t.it,
						month: e.month,
						day: e.day,
						isHoliday: e.isHoliday,
						icon: e.icon,
					})
				}
			}
			add('shamsi', ev.shamsiEvents)
			add('gregorian', ev.gregorianEvents)
			add('hijri', ev.hijriEvents)
			counts = await replaceAllEvents(stored)
			eventsOk = true
			console.log(
				`[crawl] events ok — shamsi=${counts.shamsi} gregorian=${counts.gregorian} hijri=${counts.hijri}`
			)
		} catch (err) {
			errors.push(`events-store: ${msg(err)}`)
		}
	}

	if (sb) {
		try {
			await putSnapshot('searchbox', localizeSearchbox(sb, map, 'fa'))
			await putSnapshot('searchbox:en', localizeSearchbox(sb, map, 'en'))
			await putSnapshot('searchbox:it', localizeSearchbox(sb, map, 'it'))
			searchboxOk = true
			console.log('[crawl] searchbox ok (fa/en/it)')
		} catch (err) {
			errors.push(`searchbox-store: ${msg(err)}`)
		}
	}

	const ok = eventsOk && searchboxOk
	await pool.query(
		`UPDATE crawl_runs
		 SET finished_at = now(), ok = $2,
		     shamsi_count = $3, gregorian_count = $4, hijri_count = $5, error = $6
		 WHERE id = $1`,
		[runId, ok, counts.shamsi, counts.gregorian, counts.hijri, errors.length ? errors.join('; ') : null]
	)

	if (!eventsOk && !searchboxOk) throw new Error(errors.join('; ') || 'crawl failed')
	return { ok, events: counts, searchbox: searchboxOk, errors }
}
