import { SectionPanel } from '@/components/section-panel'
import { ToggleSwitch } from '@/components/toggle-switch.component'
import { useGeneralSetting } from '@/context/general-setting.context'
import { useLanguage } from '@/context/language.context'
import { SearchAutocompleteSwitch } from './components/search-autocomplete.switch'

export function PrivacySettings() {
	const { t } = useLanguage()
	const {
		analyticsEnabled,
		setAnalyticsEnabled,
		browserBookmarksEnabled,
		setBrowserBookmarksEnabled,
		browserTabsEnabled,
		setBrowserTabsEnabled,
	} = useGeneralSetting()

	return (
		<div className="w-full max-w-xl mx-auto">
			<SectionPanel title={t('settings.privacy.title')} delay={0.1}>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex-1 space-y-2">
							<h3 className="font-medium text-content">
								{t('settings.privacy.analytics.title')}
							</h3>
							<p className="text-sm font-light leading-relaxed text-muted">
								{t('settings.privacy.analytics.description')}
							</p>
						</div>
						<div className="flex-shrink-0 ms-4">
							<ToggleSwitch
								enabled={analyticsEnabled}
								onToggle={() => setAnalyticsEnabled(!analyticsEnabled)}
							/>
						</div>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex-1 space-y-2">
							<h3 className="font-medium text-content">
								{t('settings.privacy.bookmarks.title')}
							</h3>
							<p className="text-sm font-light leading-relaxed text-muted">
								{t('settings.privacy.bookmarks.description')}
							</p>
						</div>
						<div className="flex-shrink-0 ms-4">
							<ToggleSwitch
								enabled={browserBookmarksEnabled}
								onToggle={() =>
									setBrowserBookmarksEnabled(!browserBookmarksEnabled)
								}
							/>
						</div>
					</div>
					<div className="flex items-center justify-between">
						<div className="flex-1 space-y-2">
							<h3 className="font-medium text-content">
								{t('settings.privacy.tabs.title')}
							</h3>
							<p className="text-sm font-light leading-relaxed text-muted">
								{t('settings.privacy.tabs.description')}
							</p>
						</div>
						<div className="flex-shrink-0 ms-4">
							<ToggleSwitch
								enabled={browserTabsEnabled}
								onToggle={() =>
									setBrowserTabsEnabled(!browserTabsEnabled)
								}
							/>
						</div>
					</div>
					<SearchAutocompleteSwitch />
				</div>
			</SectionPanel>
		</div>
	)
}
