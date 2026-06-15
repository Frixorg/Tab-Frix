import { useAuth } from '@/context/auth.context'
import { useLanguage } from '@/context/language.context'
import { useGetUserInventory } from '@/services/hooks/market/getUserInventory.hook'
import { BrowserTitleSelector } from './components/browserTitle-selector'
import { FontSelector } from './components/font-selector'
import { ThemeSelector } from './components/theme-selector'
import { UISelector } from './components/ui-selector'
export function AppearanceSettingTab() {
	const { isAuthenticated } = useAuth()
	const { dir } = useLanguage()
	const { data } = useGetUserInventory(isAuthenticated)

	return (
		<div className="w-full max-w-xl mx-auto" dir={dir}>
			<UISelector />
			<ThemeSelector fetched_themes={data?.themes || []} />
			<FontSelector fetched_fonts={data?.fonts || []} />
			<BrowserTitleSelector
				fetched_browserTitles={data?.browser_titles || []}
				isAuthenticated={isAuthenticated}
			/>
		</div>
	)
}
