import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiShoppingBag } from 'react-icons/fi'
import { IoMdMoon, IoMdStar, IoMdSunny } from 'react-icons/io'
import { MdOutlineBlurOn } from 'react-icons/md'
import Analytics from '@/analytics'
import { callEvent } from '@/common/utils/call-event'
import { ItemSelector } from '@/components/item-selector'
import { SectionPanel } from '@/components/section-panel'
import Tooltip from '@/components/toolTip'
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
	const { t } = useTranslation()
	const { setTheme, theme } = useTheme()
	const [themes, setThemes] = useState<ThemeItem[]>([])
	const [selected, setSelected] = useState<ThemeItem | null>(null)

	const defaultThemes = useMemo((): ThemeItem[] => {
		const tk = (id: string) => `settings.appearance.theme.themes.${id}` as const
		return [
			{
				id: 'glass',
				name: t(`${tk('glass')}.name`),
				icon: <MdOutlineBlurOn size={14} />,
				description: t(`${tk('glass')}.description`),
			},
			{
				id: 'icy',
				name: t(`${tk('icy')}.name`),
				icon: <MdOutlineBlurOn size={14} />,
				description: t(`${tk('icy')}.description`),
			},
			{
				id: 'light',
				name: t(`${tk('light')}.name`),
				icon: <IoMdSunny size={14} />,
				description: t(`${tk('light')}.description`),
			},
			{
				id: 'dark',
				name: t(`${tk('dark')}.name`),
				icon: <IoMdMoon size={14} />,
				description: t(`${tk('dark')}.description`),
			},
			{
				id: 'zarna',
				name: t(`${tk('zarna')}.name`),
				icon: <IoMdStar size={14} />,
				description: t(`${tk('zarna')}.description`),
			},
		]
	}, [t])

	useEffect(() => {
		const mapped: ThemeItem[] = (fetched_themes ?? []).map((item) => ({
			id: item.value,
			name: item.name ?? t('settings.appearance.theme.unnamed'),
			icon: <IoMdStar size={14} />,
			description: item?.description || t('settings.appearance.theme.purchasedThemeFallback'),
		}))
		setThemes([...defaultThemes, ...mapped])
	}, [fetched_themes, defaultThemes, t])

	useEffect(() => {
		const currentTheme = themes.find((th) => th.id === theme)
		if (currentTheme) {
			setSelected(currentTheme)
		}
	}, [themes, theme])

	function onClick(item: ThemeItem) {
		setTheme(item.id)
		setSelected(item)
		Analytics.event('theme_selected')
	}

	const handleMoreClick = () => {
		Analytics.event('theme_market_opened')
		callEvent('openMarketModal')
	}

	const renderThemePreview = (item: ThemeItem) => (
		<Tooltip content={item.description}>
			<div className="flex items-center gap-2">
				<span
					className="flex items-center justify-center w-5 h-5 rounded-full bg-content bg-glass text-primary"
					data-theme={item.id}
				>
					{item.icon}
				</span>
				<span className="w-32 text-xs truncate">{item.description}</span>
			</div>
		</Tooltip>
	)

	return (
		<SectionPanel title={t('settings.appearance.theme.title')} delay={0.2} size="sm">
			<div className="space-y-3">
				<p className="text-sm text-muted">{t('settings.appearance.theme.intro')}</p>

				<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
					{themes.map((item) => (
						<ItemSelector
							isActive={selected?.id === item.id}
							onClick={() => onClick(item)}
							key={item.id}
							className="w-full !h-20 !max-h-20 !min-h-20"
							label={item.name}
							description={renderThemePreview(item)}
						/>
					))}
					<button
						type="button"
						className="flex items-center justify-center w-full h-20 text-xs border border-content border-muted gap-0.5 text-muted hover:!text-primary cursor-pointer hover:!border-primary transition-all duration-200 rounded-xl"
						onClick={() => handleMoreClick()}
					>
						<FiShoppingBag size={18} />
						<span>{t('settings.appearance.theme.market')}</span>
					</button>
				</div>
			</div>
		</SectionPanel>
	)
}
