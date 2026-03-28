import { useEffect } from 'react'
import { getFromStorage } from '@/common/storage'
import i18n from '@/i18n'
import { applyDocumentLang } from '@/i18n/document'
import { DEFAULT_LANGUAGE, isAppLanguage } from '@/i18n/types'

/** Loads saved language from extension storage and applies `dir` / `lang` on the document. */
export function LanguageSync() {
	useEffect(() => {
		void (async () => {
			const saved = await getFromStorage('language')
			if (saved && isAppLanguage(saved)) {
				await i18n.changeLanguage(saved)
				applyDocumentLang(saved)
			} else {
				await i18n.changeLanguage(DEFAULT_LANGUAGE)
				applyDocumentLang(DEFAULT_LANGUAGE)
			}
		})()
	}, [])

	return null
}
