import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fa from './locales/fa.json'
import it from './locales/it.json'
import { DEFAULT_LANGUAGE } from './types'

void i18n.use(initReactI18next).init({
	resources: {
		en: { translation: en },
		fa: { translation: fa },
		it: { translation: it },
	},
	lng: DEFAULT_LANGUAGE,
	fallbackLng: DEFAULT_LANGUAGE,
	supportedLngs: ['en', 'fa', 'it'],
	interpolation: {
		escapeValue: false,
	},
})

export default i18n
