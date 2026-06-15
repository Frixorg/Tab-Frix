export type Language = 'en' | 'it' | 'fa'

export type Direction = 'ltr' | 'rtl'

export interface LanguageMeta {
	/** ISO code used as the storage value and `lang` attribute */
	code: Language
	/** Name written in the language itself (shown in the selector) */
	nativeName: string
	/** Name written in English (helper label) */
	englishName: string
	/** Text direction for this language */
	dir: Direction
	/** Emoji flag for the selector */
	flag: string
}

export const DEFAULT_LANGUAGE: Language = 'en'

export const LANGUAGES: LanguageMeta[] = [
	{
		code: 'en',
		nativeName: 'English',
		englishName: 'English',
		dir: 'ltr',
		flag: '🇬🇧',
	},
	{
		code: 'it',
		nativeName: 'Italiano',
		englishName: 'Italian',
		dir: 'ltr',
		flag: '🇮🇹',
	},
	{
		code: 'fa',
		nativeName: 'فارسی',
		englishName: 'Persian',
		dir: 'rtl',
		flag: '🇮🇷',
	},
]

export const LANGUAGE_DIRECTION: Record<Language, Direction> = {
	en: 'ltr',
	it: 'ltr',
	fa: 'rtl',
}

/** Recursive dictionary type. Leaves are strings (or string arrays for lists). */
export interface TranslationTree {
	[key: string]: string | string[] | TranslationTree
}

/** Non-English dictionaries may be partial; missing keys fall back to English. */
export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
