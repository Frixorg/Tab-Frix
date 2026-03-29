import { useTranslation } from 'react-i18next'
import { LuLayers, LuLayoutTemplate } from 'react-icons/lu'
import { ItemSelector } from '@/components/item-selector'
import { SectionPanel } from '@/components/section-panel'
import { useAppearanceSetting } from '@/context/appearance.context'

export function UISelector() {
	const { t } = useTranslation()
	const { setUI, ui } = useAppearanceSetting()
	function onClick(item: string) {
		setUI(item as 'ADVANCED' | 'SIMPLE')
	}

	return (
		<SectionPanel
			title={
				<div className="flex items-center gap-1">
					<p>{t('settings.appearance.ui.title')}</p>
					<span className="text-white badge badge-error badge-xs outline-2 outline-error/20 ms-1">
						{t('settings.appearance.ui.badgeNew')}
					</span>
				</div>
			}
			size="sm"
		>
			<div className="space-y-4">
				<div className="flex flex-col gap-1">
					<p className="text-xs text-muted">{t('settings.appearance.ui.intro')}</p>
				</div>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<ItemSelector
						isActive={ui === 'ADVANCED'}
						onClick={() => onClick('ADVANCED')}
						label={
							<div className="flex items-center gap-2">
								<LuLayers size={16} className="text-primary/80" />
								<span>{t('settings.appearance.ui.advanced.label')}</span>
							</div>
						}
						description={t('settings.appearance.ui.advanced.description')}
					/>
					<ItemSelector
						isActive={ui === 'SIMPLE'}
						onClick={() => onClick('SIMPLE')}
						label={
							<div className="flex items-center gap-2">
								<LuLayoutTemplate size={16} className="text-primary/80" />
								<span>{t('settings.appearance.ui.simple.label')}</span>
							</div>
						}
						description={t('settings.appearance.ui.simple.description')}
					/>
				</div>
			</div>
		</SectionPanel>
	)
}
