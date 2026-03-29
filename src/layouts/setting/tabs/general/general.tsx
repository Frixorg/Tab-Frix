import { useTranslation } from 'react-i18next'
import { LanguageSettings } from './components/language-settings'
import { SelectCity } from './components/select-city'
import { TimezoneSettings } from './components/timezone-settings'

export function GeneralSettingTab() {
	const { i18n } = useTranslation()
	const dir = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'

	return (
		<div className="w-full max-w-xl mx-auto" dir={dir}>
			<LanguageSettings />
			<SelectCity key={'selectCity'} />
			<TimezoneSettings key="timezone" />
		</div>
	)
}
