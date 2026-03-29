import { useTranslation } from 'react-i18next'
import { FiInfo } from 'react-icons/fi'
import { SectionPanel } from '@/components/section-panel'
import { Connections } from '../user-profile/connections/connections'

export const ConnectionPlatformsTab = () => {
	const { t, i18n } = useTranslation()
	const dir = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'

	return (
		<div className="space-y-2" dir={dir}>
			<SectionPanel title={t('settings.platforms.sectionTitle')} size="xs">
				<div className="relative p-2 border rounded-2xl bg-base-200/40 border-base-300/40">
					<div className="flex items-start gap-3">
						<div className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary/10 shrink-0">
							<FiInfo className="w-4 h-4 text-primary" />
						</div>

						<p className="text-xs leading-6 text-base-content/80">
							{t('settings.platforms.intro')}
						</p>
					</div>
				</div>

				<Connections />
			</SectionPanel>
		</div>
	)
}
