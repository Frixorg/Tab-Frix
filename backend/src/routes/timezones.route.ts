import type { FastifyInstance } from 'fastify'

// Self-hosted timezone list — generated from the OS/ICU via Intl, so it needs no
// upstream call (api.widgetify) and no seed. Shape matches what the extension
// expects: { label, value, offset }. Values are unique IANA zone ids, so the
// frontend's `key={tz.value}` never collides (fixes the duplicate "UTC" warning).

interface Timezone {
	label: string
	value: string
	offset: string
}

function offsetFor(tz: string, now: Date): { label: string; minutes: number } {
	try {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			timeZoneName: 'longOffset',
		}).formatToParts(now)
		const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+00:00'
		const m = name.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/)
		if (!m) return { label: '+00:00', minutes: 0 }
		const sign = m[1] === '-' ? -1 : 1
		const hh = Number.parseInt(m[2], 10)
		const mm = m[3] ? Number.parseInt(m[3], 10) : 0
		const minutes = sign * (hh * 60 + mm)
		const label = `${m[1]}${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
		return { label, minutes }
	} catch {
		return { label: '+00:00', minutes: 0 }
	}
}

function buildTimezones(): Timezone[] {
	const now = new Date()
	const supported = (
		Intl as unknown as { supportedValuesOf?: (k: string) => string[] }
	).supportedValuesOf
	const supportedZones =
		typeof supported === 'function' ? supported('timeZone') : []
	// Guarantee a bare "UTC" entry (ICU lists it as Etc/UTC on some runtimes); the
	// Set below dedupes if it's already present.
	const zones: string[] = ['UTC', ...supportedZones]

	const seen = new Set<string>()
	const list: { tz: Timezone; minutes: number }[] = []
	for (const tz of zones) {
		if (seen.has(tz)) continue
		seen.add(tz)
		const { label: offset, minutes } = offsetFor(tz, now)
		list.push({
			tz: { value: tz, label: tz.replace(/_/g, ' '), offset },
			minutes,
		})
	}
	list.sort((a, b) => a.minutes - b.minutes || a.tz.value.localeCompare(b.tz.value))
	return list.map((x) => x.tz)
}

// Offsets shift with DST, so rebuild at most hourly.
let cache: { at: number; data: Timezone[] } | null = null

export async function timezonesRoutes(app: FastifyInstance): Promise<void> {
	app.get('/date/timezones', async () => {
		if (!cache || Date.now() - cache.at > 60 * 60 * 1000) {
			cache = { at: Date.now(), data: buildTimezones() }
		}
		return cache.data
	})
}
