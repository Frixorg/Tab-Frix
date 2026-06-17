import { config } from '../config'
import {
	getCachedTranslations,
	putTranslations,
	type Translation,
} from '../db/translations.repo'

export function translateEnabled(): boolean {
	return config.llmApiKey.length > 0
}

// Deterministic Persian normalisation (safe — never uses the LLM, so religious /
// cultural wording is preserved): Arabic Yeh/Kaf -> Persian, collapse whitespace.
export function normalizeFa(input: string): string {
	return input
		.replace(/ي/g, 'ی') // ي -> ی
		.replace(/ك/g, 'ک') // ك -> ک
		.replace(/‌+/g, '‌') // collapse repeated ZWNJ
		.replace(/\s+/g, ' ')
		.trim()
}

interface ChatResponse {
	choices?: Array<{ message?: { content?: string } }>
}

// Translate one batch via an OpenAI-compatible chat-completions endpoint.
// Returns same-order [{en, it}].
async function llmTranslateBatch(texts: string[]): Promise<Translation[]> {
	const system =
		'You translate UI strings for an Iranian new-tab dashboard. Each input is a ' +
		'Persian calendar event / holiday name (including religious occasions) or an ' +
		'app/search label. Translate accurately and concisely into natural English and ' +
		'Italian. Preserve proper nouns and brand names (e.g. Gmail, ChatGPT, Bing) and ' +
		'religious honorifics. Do not add commentary.'
	const user =
		'Translate every item to English ("en") and Italian ("it"). Respond with ONLY ' +
		'JSON of the form {"items":[{"en":"...","it":"..."}]} preserving input order.\n' +
		'Items:\n' +
		JSON.stringify(texts)

	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), config.llmTimeoutMs)
	try {
		const res = await fetch(`${config.llmBaseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${config.llmApiKey}`,
			},
			body: JSON.stringify({
				model: config.llmModel,
				temperature: 0,
				response_format: { type: 'json_object' },
				messages: [
					{ role: 'system', content: system },
					{ role: 'user', content: user },
				],
			}),
			signal: controller.signal,
		})
		if (!res.ok) {
			const body = await res.text().catch(() => '')
			throw new Error(`LLM ${res.status} ${res.statusText} ${body}`.slice(0, 240))
		}
		const data = (await res.json()) as ChatResponse
		const content = data.choices?.[0]?.message?.content ?? '{}'
		const parsed = JSON.parse(content) as { items?: Array<{ en?: string; it?: string }> }
		const items = Array.isArray(parsed.items) ? parsed.items : []
		return texts.map((_, i) => ({
			en: typeof items[i]?.en === 'string' ? (items[i]!.en as string) : null,
			it: typeof items[i]?.it === 'string' ? (items[i]!.it as string) : null,
		}))
	} finally {
		clearTimeout(timer)
	}
}

// Translate a list of (possibly duplicate) source strings. Uses the cache for
// known strings and only sends unseen ones to the LLM. Always returns an entry
// for every unique input (null en/it when translation is unavailable).
export async function translateTexts(
	allTexts: string[]
): Promise<Map<string, Translation>> {
	const unique = [...new Set(allTexts.map((t) => t.trim()).filter(Boolean))]
	const result = await getCachedTranslations(unique)

	const missing = unique.filter((t) => !result.has(t))
	if (missing.length === 0 || !translateEnabled()) {
		for (const t of unique) if (!result.has(t)) result.set(t, { en: null, it: null })
		return result
	}

	const fresh: Array<{ source: string; en: string | null; it: string | null }> = []
	for (let i = 0; i < missing.length; i += config.llmBatchSize) {
		const batch = missing.slice(i, i + config.llmBatchSize)
		let translated: Translation[]
		try {
			translated = await llmTranslateBatch(batch)
		} catch (err) {
			console.error(
				'[translate] batch failed —',
				err instanceof Error ? err.message : String(err)
			)
			translated = batch.map(() => ({ en: null, it: null }))
		}
		batch.forEach((src, j) => {
			const tr = translated[j] ?? { en: null, it: null }
			result.set(src, tr)
			fresh.push({ source: src, en: tr.en, it: tr.it })
		})
	}

	if (fresh.length > 0) await putTranslations(fresh)
	return result
}
