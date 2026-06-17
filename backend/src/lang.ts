export type Lang = 'fa' | 'en' | 'it'

// Coerce an arbitrary query value into a supported language (defaults to fa).
export function parseLang(value: unknown): Lang {
	const l = String(value ?? '').toLowerCase()
	return l === 'en' || l === 'it' ? l : 'fa'
}
