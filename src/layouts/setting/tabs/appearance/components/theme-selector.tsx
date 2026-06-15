import type React from 'react'
import { useEffect, useState } from 'react'
import { FiShoppingBag } from 'react-icons/fi'
import { IoMdMoon, IoMdStar, IoMdSunny } from 'react-icons/io'
import { MdOutlineBlurOn } from 'react-icons/md'
import Analytics from '@/analytics'
import { callEvent } from '@/common/utils/call-event'
import { ItemSelector } from '@/components/item-selector'
import { SectionPanel } from '@/components/section-panel'
import { useLanguage } from '@/context/language.context'
import { useTheme } from '@/context/theme.context'
import type { UserInventoryItem } from '@/services/hooks/market/market.interface'

interface ThemeItem {
	id: string
	name: string
	icon: React.ReactElement
	description?: string
}

interface Props {
	fetched_themes: UserInventoryItem[]
}

export function ThemeSelector({ fetched_themes }: Props) {
	const { t } = useLanguage()
	const { setTheme, theme } = useTheme()

	const defaultThemes: ThemeItem[] = [
		{
			id: 'light',
			name: t('settings.appearance.theme.light'),
			icon: <IoMdSunny size={14} />,
			description: t('settings.appearance.theme.lightDesc'),
		},
		{
			id: 'dark',
			name: t('settings.appearance.theme.dark'),
			icon: <IoMdMoon size={14} />,
			description: t('settings.appearance.theme.darkDesc'),
		},
		{
			id: 'glass',
			name: t('settings.appearance.theme.glass'),
			icon: <MdOutlineBlurOn size={14} />,
			description: t('settings.appearance.theme.glassDesc'),
		},
		{
			id: 'icy',
			name: t('settings.appearance.theme.icy'),
			icon: <MdOutlineBlurOn size={14} />,
			description: t('settings.appearance.theme.icyDesc'),
		},
		{
			id: 'zarna',
			name: t('settings.appearance.theme.zarna'),
			icon: <IoMdStar size={14} />,
			description: t('settings.appearance.theme.zarnaDesc'),
		},
	]

	const [themes, setThemes] = useState<ThemeItem[]>(defaultThemes)
	const [selected, setSelected] = useState<ThemeItem | null>(null)

	function onClick(item: ThemeItem) {
		setTheme(item.id)
		setSelected(item)
		Analytics.event('theme_selected')
	}

	useEffect(() => {
		const currentTheme = themes.find((t) => t.id === theme)
		if (currentTheme) {
			setSelected(currentTheme)
		}
	}, [themes])

	useEffect(() => {
		if (fetched_themes.length) {
			const mapped: ThemeItem[] = fetched_themes.map((item) => ({
				id: item.value,
				name: item.name ?? t('common.noName'),
				icon: <IoMdStar size={14} />,
				description: item?.description || t('settings.appearance.theme.purchased'),
			}))
			setThemes([...defaultThemes, ...mapped])
		}
	}, [fetched_themes])

	const handleMoreClick = () => {
		Analytics.event('theme_market_opened')
		callEvent('openMarketModal')
	}

	return (
		<SectionPanel title={t('settings.appearance.theme.title')} delay={0.2} size="sm">
			<div className="space-y-3">
				<p className="text-sm text-muted">
					{t('settings.appearance.theme.description')}
				</p>

				<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
					{themes.map((item) => (
						<ItemSelector
							isActive={selected?.id === item.id}
							key={item.id}
							label={item.name}
							onClick={() => onClick(item)}
						/>
					))}
					<div
						className="flex items-center justify-center w-full h-10 text-xs border border-content border-muted gap-0.5 text-muted hover:!text-primary cursor-pointer hover:!border-primary transition-all duration-200 rounded-xl"
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
