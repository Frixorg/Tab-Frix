import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiShoppingBag } from 'react-icons/fi'
import Analytics from '@/analytics'
import { callEvent } from '@/common/utils/call-event'
import { ItemSelector } from '@/components/item-selector'
import { SectionPanel } from '@/components/section-panel'
import { useAppearanceSetting } from '@/context/appearance.context'
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
	const { t } = useTranslation()
	const { fontFamily, setFontFamily } = useAppearanceSetting()

	const defaultFonts = useMemo((): FontItem[] => {
		const desc = t('settings.appearance.font.defaultFontDesc')
		return [
			{ value: 'Vazir', label: t('settings.appearance.font.names.vazir'), description: desc },
			{ value: 'Samim', label: t('settings.appearance.font.names.samim'), description: desc },
			{ value: 'Pofak', label: t('settings.appearance.font.names.pofak'), description: desc },
			{ value: 'rooyin', label: t('settings.appearance.font.names.rooyin'), description: desc },
			{ value: 'Inter', label: t('settings.appearance.font.names.inter'), description: desc },
			{ value: 'Roboto', label: t('settings.appearance.font.names.roboto'), description: desc },
			{ value: 'Outfit', label: t('settings.appearance.font.names.outfit'), description: desc },
		]
	}, [t])

	const [fonts, setFonts] = useState<FontItem[]>(defaultFonts)

	useEffect(() => {
		setFonts(defaultFonts)
	}, [defaultFonts])

	useEffect(() => {
		const mapped: FontItem[] = (fetched_fonts ?? []).map((item) => ({
			value: item.value,
			label: item.name ?? t('settings.appearance.font.unnamed'),
			description: item?.description || t('settings.appearance.font.purchasedFallback'),
		}))
		setFonts([...defaultFonts, ...mapped])
	}, [fetched_fonts, defaultFonts, t])

	const handleMoreClick = () => {
		Analytics.event('font_market_opened')
		callEvent('openMarketModal')
	}

	const renderFontPreview = ({ value }: FontItem) => (
		<span className="text-lg truncate" style={{ fontFamily: value }}>
			{t('settings.appearance.font.previewSample')}
		</span>
	)
	return (
		<SectionPanel title={t('settings.appearance.font.title')} delay={0.15} size="sm">
			<div className="space-y-3">
				<p className="text-xs text-muted">{t('settings.appearance.font.intro')}</p>
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
					{/* <button
						type="button"
						className="flex items-center justify-center w-full h-20 text-xs border border-content border-muted gap-0.5 text-muted hover:!text-primary cursor-pointer hover:!border-primary transition-all duration-200 rounded-xl"
						onClick={() => handleMoreClick()}
					>
						<FiShoppingBag size={18} />
						<span>{t('settings.appearance.font.market')}</span>
					</button> */}
				</div>
			</div>
		</SectionPanel>
	)
}
