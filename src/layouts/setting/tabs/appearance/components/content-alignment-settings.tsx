import { useTranslation } from 'react-i18next'
import { ItemSelector } from '@/components/item-selector'
import { SectionPanel } from '@/components/section-panel'
import { useAppearanceSetting } from '@/context/appearance.context'

export function ContentAlignmentSettings() {
	const { t } = useTranslation()
	const { contentAlignment, setContentAlignment, ui } = useAppearanceSetting()
	if (ui === 'SIMPLE') return null
	return (
		<SectionPanel title={t('settings.appearance.alignment.title')} delay={0.3} size="sm">
			<div className={`space-y-3`}>
				<p className="text-xs text-muted">
					{t('settings.appearance.alignment.verticalLabel')}
				</p>
				<div className="flex gap-3">
					<ItemSelector
						isActive={contentAlignment === 'center'}
						onClick={() => setContentAlignment('center')}
						label={t('settings.appearance.alignment.center')}
						key="center"
						className="w-1/2"
						description={t('settings.appearance.alignment.centerDesc')}
					/>
					<ItemSelector
						isActive={contentAlignment === 'top'}
						onClick={() => setContentAlignment('top')}
						label={t('settings.appearance.alignment.top')}
						key="top"
						className="w-1/2"
						description={t('settings.appearance.alignment.topDesc')}
					/>
				</div>
			</div>
		</SectionPanel>
	)
}
