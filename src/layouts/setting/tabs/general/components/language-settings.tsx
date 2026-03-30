import { useTranslation } from 'react-i18next'
import { setToStorage } from '@/common/storage'
import { ItemSelector } from '@/components/item-selector'
import { SectionPanel } from '@/components/section-panel'
import { useAppearanceSetting } from '@/context/appearance.context'
import { applyDocumentLang } from '@/i18n/document'
import type { AppLanguage } from '@/i18n/types'
import { APP_LANGUAGES } from '@/i18n/types'

export function LanguageSettings() {
	const { t, i18n } = useTranslation()

	const current =
		APP_LANGUAGES.find((code) => i18n.language.startsWith(code)) ?? 'en'

	const { fontFamily, setFontFamily } = useAppearanceSetting()
	const PERSIAN_FONTS = ['Vazir', 'Samim', 'Pofak', 'rooyin']
	const ENGLISH_FONTS = ['Inter', 'Roboto', 'Outfit']

	async function selectLang(lng: AppLanguage) {
		if (lng === current) return
		await i18n.changeLanguage(lng)
		await setToStorage('language', lng)
		applyDocumentLang(lng)

		if ((lng === 'en' || lng === 'it') && PERSIAN_FONTS.includes(fontFamily)) {
			setFontFamily('Inter')
		}

		if (lng === 'fa' && ENGLISH_FONTS.includes(fontFamily)) {
			setFontFamily('Vazir')
		}
	}

	return (
		<SectionPanel title={t('settings.language.title')} delay={0} size="sm">
			<div className="space-y-4">
				<p className="text-xs text-muted">{t('settings.language.description')}</p>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
					<ItemSelector
						isActive={current === 'en'}
						onClick={() => void selectLang('en')}
						label={
							<div className="flex items-center ms-1">
								<span className="mb-[-2px]">{t('settings.language.en')}</span>
							</div>
						}
					/>
					<ItemSelector
						isActive={current === 'fa'}
						onClick={() => void selectLang('fa')}
						label={
							<div className="flex items-center ms-1">
								<span>{t('settings.language.fa')}</span>
							</div>
						}
					/>
					<ItemSelector
						isActive={current === 'it'}
						onClick={() => void selectLang('it')}
						label={
							<div className="flex items-center ms-1">
								<span className="mb-[-2px]">{t('settings.language.it')}</span>
							</div>
						}
					/>
				</div>
			</div>
		</SectionPanel>
	)
}
