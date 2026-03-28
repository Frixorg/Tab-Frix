export type AppLanguage = 'en' | 'fa' | 'it'

export const APP_LANGUAGES: AppLanguage[] = ['en', 'fa', 'it']

export const DEFAULT_LANGUAGE: AppLanguage = 'en'

export function isAppLanguage(value: unknown): value is AppLanguage {
	return value === 'en' || value === 'fa' || value === 'it'
}
