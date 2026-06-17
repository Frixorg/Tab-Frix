import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { migrate } from '../db/migrate'
import { pool } from '../db/pool'
import { replaceAllEvents, type StoredEvent } from '../db/events.repo'
import { putSnapshot } from '../db/snapshots.repo'
import { putTranslations, type Translation } from '../db/translations.repo'
import { normalizeFa } from '../translate/llm'
import type { Calendar } from '../types'

// Pushes the pre-built seed (raw Persian data + my en/it translations) straight
// into the database — no upstream call, no runtime translation service.
//   Files (in ./seed, override with SEED_DIR):
//     events.json        raw upstream /date/events snapshot (Persian)
//     searchbox.json     raw upstream /searchbox snapshot (Persian)
//     translations.jsonl one {"s","en","it"} per line (s = Persian source)
//   Run: npm run seed   (or seed:dev for ts-source)

const SEED_DIR = process.env.SEED_DIR || join(process.cwd(), 'seed')

function readJson<T = any>(file: string): T {
	return JSON.parse(readFileSync(join(SEED_DIR, file), 'utf8')) as T
}

// Build a normalized-Persian -> {en,it} map from translations.jsonl. Each line is
// {"i":<index into sources.json>,"en":"...","it":"..."} (or {"s":"<persian>",...}).
function readTranslationMap(): Map<string, Translation> {
	const map = new Map<string, Translation>()
	let sources: string[] = []
	try {
		sources = readJson<string[]>('sources.json')
	} catch {
		console.warn('[seed] sources.json not found (index-based lines will be skipped)')
	}
	let txt = ''
	try {
		txt = readFileSync(join(SEED_DIR, 'translations.jsonl'), 'utf8')
	} catch {
		console.warn('[seed] translations.jsonl not found — events will be Persian only')
		return map
	}
	for (const line of txt.split('\n')) {
		const l = line.trim()
		if (!l) continue
		try {
			const o = JSON.parse(l) as {
				s?: string
				i?: number
				en?: string | null
				it?: string | null
			}
			let src: string | undefined
			if (typeof o.s === 'string') src = o.s
			else if (Number.isInteger(o.i) && typeof sources[o.i as number] === 'string')
				src = sources[o.i as number]
			if (src) map.set(normalizeFa(src), { en: o.en ?? null, it: o.it ?? null })
		} catch {
			/* skip malformed line */
		}
	}
	return map
}

function localizeSearchbox(
	raw: Record<string, unknown>,
	map: Map<string, Translation>,
	lang: 'fa' | 'en' | 'it'
): Record<string, unknown> {
	const tr = (s: string): string => {
		if (lang === 'fa') return normalizeFa(s)
		const t = map.get(normalizeFa(s))
		return (lang === 'en' ? t?.en : t?.it) || s
	}
	const engines = Array.isArray(raw.search_engines) ? (raw.search_engines as any[]) : []
	const sites = Array.isArray(raw.recommendedSites) ? (raw.recommendedSites as any[]) : []
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

function localizeContents(
	raw: Record<string, unknown>,
	map: Map<string, Translation>,
	lang: 'fa' | 'en' | 'it'
): Record<string, unknown> {
	const tr = (s: string): string => {
		if (lang === 'fa') return normalizeFa(s)
		const t = map.get(normalizeFa(s))
		return (lang === 'en' ? t?.en : t?.it) || s
	}
	const cats = Array.isArray(raw.contents) ? (raw.contents as any[]) : []
	return {
		...raw,
		contents: cats.map((cat) => ({
			...cat,
			category: typeof cat.category === 'string' ? tr(cat.category) : cat.category,
			links: (Array.isArray(cat.links) ? cat.links : []).map((l: any) => ({
				...l,
				name: typeof l.name === 'string' ? tr(l.name) : l.name,
				badge: typeof l.badge === 'string' ? tr(l.badge) : l.badge,
			})),
			badges: (Array.isArray(cat.badges) ? cat.badges : []).map((b: any) => ({
				...b,
				label: typeof b.label === 'string' ? tr(b.label) : b.label,
			})),
		})),
	}
}

export async function seedDatabase(): Promise<void> {
	await migrate()
	const map = readTranslationMap()
	const events = readJson('events.json')
	const searchbox = readJson<Record<string, unknown>>('searchbox.json')
	let contents: Record<string, unknown> | null = null
	try {
		contents = readJson<Record<string, unknown>>('contents.json')
	} catch {
		console.warn('[seed] contents.json not found — skipping contents')
	}

	// Seed the translations table so a future crawl reuses these (still no LLM).
	await putTranslations(
		[...map.entries()].map(([source, t]) => ({ source, en: t.en, it: t.it }))
	)

	// Events with en/it titles (fa fallback when a translation is missing).
	const stored: StoredEvent[] = []
	const add = (calendar: Calendar, arr: any[]) => {
		for (const e of arr || []) {
			const title = typeof e?.title === 'string' ? e.title.trim() : ''
			const month = Number(e?.month)
			const day = Number(e?.day)
			if (!title || !Number.isInteger(month) || !Number.isInteger(day)) continue
			const t = map.get(normalizeFa(title)) ?? { en: null, it: null }
			stored.push({
				calendar,
				title: normalizeFa(title),
				titleEn: t.en,
				titleIt: t.it,
				month,
				day,
				isHoliday: Boolean(e?.isHoliday),
				icon: typeof e?.icon === 'string' && e.icon ? e.icon : null,
			})
		}
	}
	add('shamsi', events.shamsiEvents)
	add('gregorian', events.gregorianEvents)
	add('hijri', events.hijriEvents)
	const counts = await replaceAllEvents(stored)

	await putSnapshot('searchbox', localizeSearchbox(searchbox, map, 'fa'))
	await putSnapshot('searchbox:en', localizeSearchbox(searchbox, map, 'en'))
	await putSnapshot('searchbox:it', localizeSearchbox(searchbox, map, 'it'))
	if (contents) {
		await putSnapshot('contents', localizeContents(contents, map, 'fa'))
		await putSnapshot('contents:en', localizeContents(contents, map, 'en'))
		await putSnapshot('contents:it', localizeContents(contents, map, 'it'))
	}

	const withEn = stored.filter((s) => s.titleEn).length
	console.log(
		`[seed] events stored shamsi=${counts.shamsi} gregorian=${counts.gregorian} hijri=${counts.hijri}`
	)
	console.log(`[seed] translation entries=${map.size}; events with en=${withEn}/${stored.length}`)
	console.log('[seed] searchbox snapshots written: fa, en, it')
}

if (require.main === module) {
	seedDatabase()
		.then(() => pool.end())
		.then(() => process.exit(0))
		.catch((err) => {
			console.error('[seed] failed', err)
			process.exit(1)
		})
}
