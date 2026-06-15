import { en } from './locales/en'
import { fa } from './locales/fa'
import { it } from './locales/it'
import {
	type Direction,
	type Language,
	LANGUAGE_DIRECTION,
	type TranslationTree,
} from './types'

export { LANGUAGES, DEFAULT_LANGUAGE } from './types'
export type { Language, Direction, LanguageMeta } from './types'

const dictionaries: Record<Language, TranslationTree> = {
	en: en as unknown as TranslationTree,
	it: it as unknown as TranslationTree,
	fa: fa as unknown as TranslationTree,
}

export type TranslateParams = Record<string, string | number>

function resolve(
	dict: TranslationTree | undefined,
	path: string[]
): string | undefined {
	let current: unknown = dict
	for (const segment of path) {
		if (current == null || typeof current !== 'object') return undefined
		current = (current as Record<string, unknown>)[segment]
	}
	return typeof current === 'string' ? current : undefined
}

function interpolate(value: string, params?: TranslateParams): string {
	if (!params) return value
	return value.replace(/\{(\w+)\}/g, (match, key: string) =>
		params[key] !== undefined ? String(params[key]) : match
	)
}

/**
 * Translate a dot-path key for a given language.
 * Falls back to English when the key is missing, then to the key itself.
 */
export function translate(
	lang: Language,
	key: string,
	params?: TranslateParams
): string {
	const path = key.split('.')

	let value = resolve(dictionaries[lang], path)
	if (value === undefined && lang !== 'en') {
		value = resolve(dictionaries.en, path)
	}
	if (value === undefined) return key

	return interpolate(value, params)
}

export function getDirection(lang: Language): Direction {
	return LANGUAGE_DIRECTION[lang] ?? 'ltr'
}
