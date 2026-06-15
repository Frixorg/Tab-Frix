import type React from 'react'
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import { getDirection, type TranslateParams, translate } from '@/i18n'
import {
	type Direction,
	DEFAULT_LANGUAGE,
	type Language,
	type LanguageMeta,
	LANGUAGES,
} from '@/i18n/types'

interface LanguageContextType {
	lang: Language
	dir: Direction
	isRtl: boolean
	languages: LanguageMeta[]
	setLanguage: (lang: Language) => void
	t: (key: string, params?: TranslateParams) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

function applyDocumentLanguage(lang: Language) {
	const dir = getDirection(lang)
	const root = document.documentElement
	root.setAttribute('lang', lang)
	root.setAttribute('dir', dir)
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
	const [lang, setLang] = useState<Language>(DEFAULT_LANGUAGE)
	const [isInitialized, setIsInitialized] = useState(false)

	useEffect(() => {
		async function loadLanguage() {
			const stored = await getFromStorage('locale')
			const initial: Language =
				stored && LANGUAGES.some((l) => l.code === stored)
					? stored
					: DEFAULT_LANGUAGE

			applyDocumentLanguage(initial)
			setLang(initial)
			setIsInitialized(true)
		}

		loadLanguage()
	}, [])

	const setLanguage = useCallback((next: Language) => {
		setLang(next)
		applyDocumentLanguage(next)
		setToStorage('locale', next)
		Analytics.event(`set_language_${next}`)
	}, [])

	const t = useCallback(
		(key: string, params?: TranslateParams) => translate(lang, key, params),
		[lang]
	)

	const contextValue = useMemo<LanguageContextType>(() => {
		const dir = getDirection(lang)
		return {
			lang,
			dir,
			isRtl: dir === 'rtl',
			languages: LANGUAGES,
			setLanguage,
			t,
		}
	}, [lang, setLanguage, t])

	// Avoid a flash of the wrong direction before the stored language loads.
	if (!isInitialized) return null

	return (
		<LanguageContext.Provider value={contextValue}>
			{children}
		</LanguageContext.Provider>
	)
}

export function useLanguage() {
	const context = useContext(LanguageContext)
	if (!context) {
		throw new Error('useLanguage must be used within a LanguageProvider')
	}
	return context
}

/** Convenience hook returning just the translate function. */
export function useTranslation() {
	return useLanguage()
}
