import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from '@/components/toggle-switch.component'
import { SelectBox } from '@/components/selectbox/selectbox'
import { SectionPanel } from '@/components/section-panel'
import { WidgetSettingWrapper } from '@/layouts/widgets-settings/widget-settings-wrapper'
import { useSearchAndBookmarksSettings } from '@/context/search-and-bookmarks.context'

const positionOptions = [
	{ value: 'top', labelKey: 'settings.widgets.searchAndBookmarks.positionTop' },
	{
		value: 'center',
		labelKey: 'settings.widgets.searchAndBookmarks.positionCenter',
	},
	{
		value: 'bottom',
		labelKey: 'settings.widgets.searchAndBookmarks.positionBottom',
	},
]

export function SearchAndBookmarksSetting() {
	const { t } = useTranslation()
	const { settings, setShowBookmarksList, setShowBrowserBookmark, setSearchBarPosition } =
		useSearchAndBookmarksSettings()

	return (
		<WidgetSettingWrapper>
			<SectionPanel title={t('settings.widgets.searchAndBookmarks.title')} size="sm">
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between px-4 py-3 bg-base-200/50 rounded-2xl">
						<span className="text-sm font-medium text-base-content/80">
							{t('settings.widgets.searchAndBookmarks.showBookmarksList')}
						</span>
						<ToggleSwitch
							enabled={settings.showBookmarksList}
							onToggle={() => setShowBookmarksList(!settings.showBookmarksList)}
						/>
					</div>

					<div className="flex items-center justify-between px-4 py-3 bg-base-200/50 rounded-2xl">
						<span className="text-sm font-medium text-base-content/80">
							{t('settings.widgets.searchAndBookmarks.showBrowserBookmark')}
						</span>
						<ToggleSwitch
							enabled={settings.showBrowserBookmark}
							onToggle={() =>
								setShowBrowserBookmark(!settings.showBrowserBookmark)
							}
						/>
					</div>

					{!settings.showBookmarksList && (
						<div className="flex items-center justify-between px-4 py-3 bg-base-200/50 rounded-2xl">
							<span className="text-sm font-medium text-base-content/80">
								{t('settings.widgets.searchAndBookmarks.positionLabel')}
							</span>
							<SelectBox
								options={positionOptions.map((opt) => ({
									value: opt.value,
									label: t(opt.labelKey),
								}))}
								value={settings.searchBarPosition}
								onChange={(value: SearchPositionValue) =>
									setSearchBarPosition(value)
								}
							/>
						</div>
					)}
				</div>
			</SectionPanel>
		</WidgetSettingWrapper>
	)
}

type SearchPositionValue = 'top' | 'center' | 'bottom'

