import { useEffect, useState } from 'react'
import { FiShoppingBag } from 'react-icons/fi'
import Analytics from '@/analytics'
import { callEvent } from '@/common/utils/call-event'
import { ItemSelector } from '@/components/item-selector'
import { SectionPanel } from '@/components/section-panel'
import { useAppearanceSetting } from '@/context/appearance.context'
import { useLanguage } from '@/context/language.context'
import type { UserInventoryItem } from '@/services/hooks/market/market.interface'

interface FontItem {
	label: string
	value: string
	description?: string
}

interface FontSelectorProps {
	fetched_fonts: UserInventoryItem[]
}

export function FontSelector({ fetched_fonts }: FontSelectorProps) {
	const { t } = useLanguage()
	const { fontFamily, setFontFamily } = useAppearanceSetting()

	const defaultFonts: FontItem[] = [
		{ value: 'Vazir', label: t('settings.appearance.font.vazir') },
		{ value: 'Samim', label: t('settings.appearance.font.samim') },
		{ value: 'Pofak', label: t('settings.appearance.font.pofak') },
		{ value: 'rooyin', label: t('settings.appearance.font.rooyin') },
	]

	const [fonts, setFonts] = useState<FontItem[]>(defaultFonts)

	useEffect(() => {
		if (fetched_fonts.length) {
			const mapped: FontItem[] = fetched_fonts.map((item) => ({
				value: item.value,
				label: item.name ?? t('common.noName'),
				description: item?.description || t('settings.appearance.font.purchased'),
			}))
			setFonts([...defaultFonts, ...mapped])
		}
	}, [fetched_fonts])

	const handleMoreClick = () => {
		Analytics.event('font_market_opened')
		callEvent('openMarketModal')
	}

	const renderFontPreview = ({ value }: FontItem) => (
		<span className="text-lg truncate" style={{ fontFamily: value }}>
			{t('settings.appearance.font.preview')}
		</span>
	)
	return (
		<SectionPanel title={t('settings.appearance.font.title')} delay={0.15} size="sm">
			<div className="space-y-3">
				<p className={'text-xs text-muted'}>
					{t('settings.appearance.font.description')}
				</p>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
					{fonts.map((font) => (
						<ItemSelector
							isActive={fontFamily === font.value}
							onClick={() => setFontFamily(font.value)}
							key={font.value}
							className="w-full !h-20 !max-h-20 !min-h-20"
							label={font.label}
							description={renderFontPreview(font)}
							style={{ fontFamily: font.value }}
						/>
					))}
					<div
						className="flex items-center justify-center w-full h-20 text-xs border border-content border-muted gap-0.5 text-muted hover:!text-primary cursor-pointer hover:!border-primary transition-all duration-200 rounded-xl"
						onClick={() => handleMoreClick()}
					>
						<FiShoppingBag size={18} />
						<span>{t('common.store')}</span>
					</div>
				</div>
			</div>
		</SectionPanel>
	)
}
