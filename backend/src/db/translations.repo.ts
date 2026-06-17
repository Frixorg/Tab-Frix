import { pool } from './pool'

export interface Translation {
	en: string | null
	it: string | null
}

// Look up cached translations for a set of source strings.
export async function getCachedTranslations(
	sources: string[]
): Promise<Map<string, Translation>> {
	const map = new Map<string, Translation>()
	if (sources.length === 0) return map
	const placeholders = sources.map((_, i) => `$${i + 1}`).join(', ')
	const { rows } = await pool.query<{ source: string; en: string | null; it: string | null }>(
		`SELECT source, en, it FROM translations WHERE source IN (${placeholders})`,
		sources
	)
	for (const r of rows) map.set(r.source, { en: r.en, it: r.it })
	return map
}

export async function putTranslations(
	entries: Array<{ source: string; en: string | null; it: string | null }>
): Promise<void> {
	for (const e of entries) {
		await pool.query(
			`INSERT INTO translations (source, en, it, updated_at)
			 VALUES ($1, $2, $3, now())
			 ON CONFLICT (source) DO UPDATE
			   SET en = EXCLUDED.en, it = EXCLUDED.it, updated_at = now()`,
			[e.source, e.en, e.it]
		)
	}
}
