import { ItemSelector } from '@/components/item-selector'
import { SectionPanel } from '@/components/section-panel'
import { LuLayers, LuLayoutTemplate } from 'react-icons/lu'
import { useAppearanceSetting } from '@/context/appearance.context'
import { useLanguage } from '@/context/language.context'

export function UISelector() {
	const { t } = useLanguage()
	const { setUI, ui } = useAppearanceSetting()
	function onClick(item: string) {
		setUI(item as any)
	}

	return (
		<SectionPanel
			title={
				<div className="flex items-center">
					<p>{t('settings.appearance.ui.title')}</p>
					<span className="mx-1 text-white badge badge-error badge-xs outline-2 outline-error/20">
						{t('common.new')}
					</span>
				</div>
			}
			size="sm"
		>
			<div className="space-y-4">
				<div className="flex flex-col gap-1">
					<p className="text-xs text-muted">
						{t('settings.appearance.ui.description')}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<ItemSelector
						isActive={ui === 'ADVANCED'}
						onClick={() => onClick('ADVANCED')}
						label={
							<div className="flex items-center gap-2">
								<LuLayers size={16} className="text-primary/80" />
								<span>{t('settings.appearance.ui.defaultLabel')}</span>
							</div>
						}
						description={t('settings.appearance.ui.defaultDesc')}
					/>
					<ItemSelector
						isActive={ui === 'SIMPLE'}
						onClick={() => onClick('SIMPLE')}
						label={
							<div className="flex items-center gap-2">
								<LuLayoutTemplate size={16} className="text-primary/80" />
								<span>{t('settings.appearance.ui.simpleLabel')}</span>
							</div>
						}
						description={t('settings.appearance.ui.simpleDesc')}
					/>
				</div>
			</div>
		</SectionPanel>
	)
}
