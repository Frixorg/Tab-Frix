import { getCachedTranslations, type Translation } from '../db/translations.repo'

// Deterministic Persian normalisation (Arabic Yeh/Kaf -> Persian, collapse
// whitespace/ZWNJ). Used as the canonical key for translation lookups so minor
// character variants still match.
export function normalizeFa(input: string): string {
	return input
		.replace(/ي/g, 'ی')
		.replace(/ك/g, 'ک')
		.replace(/‌+/g, '‌')
		.replace(/\s+/g, ' ')
		.trim()
}

// Look up pre-built en/it translations from the seeded `translations` table,
// keyed by normalized Persian. There is NO runtime translation service — the
// translations are generated once and seeded (see src/seed/load.ts). Missing
// entries simply return null (callers fall back to Persian).
export async function translateTexts(
	allTexts: string[]
): Promise<Map<string, Translation>> {
	const keys = [...new Set(allTexts.map((t) => normalizeFa(t)).filter(Boolean))]
	const result = await getCachedTranslations(keys)
	for (const k of keys) if (!result.has(k)) result.set(k, { en: null, it: null })
	return result
}
