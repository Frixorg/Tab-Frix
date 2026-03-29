import { useTranslation } from 'react-i18next'
import { useGetUserInventory } from '@/services/hooks/market/getUserInventory.hook'
import { BrowserTitleSelector } from './components/browserTitle-selector'
import { ContentAlignmentSettings } from './components/content-alignment-settings'
import { FontSelector } from './components/font-selector'
import { ThemeSelector } from './components/theme-selector'
import { UISelector } from './components/ui-selector'

export function AppearanceSettingTab() {
	const { i18n } = useTranslation()
	const { data } = useGetUserInventory(true)
	const dir = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'

	return (
		<div className="w-full max-w-xl mx-auto" dir={dir}>
			<UISelector />
			<BrowserTitleSelector fetched_browserTitles={data?.browser_titles || []} />
			<ThemeSelector fetched_themes={data?.themes || []} />
			<ContentAlignmentSettings />
			<FontSelector fetched_fonts={data?.fonts || []} />
		</div>
	)
}
