import type { AppLanguage } from './types'

export function applyDocumentLang(lng: AppLanguage) {
	document.documentElement.lang = lng
	document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr'
}
