import type { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiShoppingBag } from 'react-icons/fi'
import Analytics from '@/analytics'
import { showToast } from '@/common/toast'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent } from '@/common/utils/call-event'
import { ItemSelector } from '@/components/item-selector'
import { renderBrowserTitlePreview } from '@/components/market/title/title-render-preview'
import { SectionPanel } from '@/components/section-panel'
import { safeAwait } from '@/services/api'
import { useChangeBrowserTitle } from '@/services/hooks/extension/updateSetting.hook'
import type { UserInventoryItem } from '@/services/hooks/market/market.interface'
import { translateError } from '@/utils/translate-error'

interface BrowserTitle {
	id: string
	name: string
	template: string
}

interface Prop {
	fetched_browserTitles: UserInventoryItem[]
}

export function BrowserTitleSelector({ fetched_browserTitles }: Prop) {
	const { t, i18n } = useTranslation()
	const titlePreviewDirection = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'
	const [browserTitles, setBrowserTitles] = useState<BrowserTitle[]>([])
	const [selected, setSelected] = useState<BrowserTitle | null>(null)

	const defaultBrowserTitles = useMemo(
		(): BrowserTitle[] => [
			{
				id: 'default',
				name: t('settings.appearance.browserTitle.defaultName'),
				template: t('settings.appearance.browserTitle.defaultTemplate'),
			},
		],
		[t]
	)

	const { mutateAsync } = useChangeBrowserTitle()

	async function onClick(item: BrowserTitle) {
		setSelected(item)
		Analytics.event('browser_title_selected')

		if (true) {
			const [error] = await safeAwait<AxiosError, any>(
				mutateAsync({ browserTitleId: item.id })
			)
			if (error) {
				showToast(translateError(error) as string, 'error')
				return
			}
			setToStorage('browserTitle', item)
		} else {
			await setToStorage('browserTitle', item)
		}

		document.title = item.template
	}

	useEffect(() => {
		const mapped: BrowserTitle[] = (fetched_browserTitles ?? []).map((item) => ({
			name: item.name || t('settings.appearance.browserTitle.unnamed'),
			id: item.id,
			template: item.value,
		}))
		setBrowserTitles([...defaultBrowserTitles, ...mapped])
	}, [fetched_browserTitles, defaultBrowserTitles, t])

	useEffect(() => {
		if (browserTitles.length === 0) return
		void (async () => {
			const stored = await getFromStorage('browserTitle')
			const match = stored
				? browserTitles.find((b) => b.id === stored.id)
				: browserTitles[0]
			setSelected(match ?? browserTitles[0])
		})()
	}, [browserTitles])

	const handleMoreClick = () => {
		Analytics.event('browser_title_market_opened')
		callEvent('openMarketModal')
	}

	return (
		<SectionPanel title={t('settings.appearance.browserTitle.title')} size="sm">
			<div className="space-y-3">
				<p className="text-xs text-muted">{t('settings.appearance.browserTitle.intro')}</p>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
					{browserTitles?.map((item) => (
						<ItemSelector
							isActive={selected?.template === item.template}
							onClick={() => onClick(item)}
							key={item.template}
							className="w-full h-20"
							label={item.name}
							description={renderBrowserTitlePreview({
								template: item.template,
							})}
						/>
					))}
					{/* <button
						type="button"
						className="flex items-center justify-center w-full h-20 text-xs border border-content border-muted gap-0.5  text-muted hover:!text-primary cursor-pointer hover:!border-primary transition-all duration-200  rounded-xl"
						onClick={() => handleMoreClick()}
					>
						<FiShoppingBag size={18} />
						<span>{t('settings.appearance.browserTitle.market')}</span>
					</button> */}
				</div>
			</div>
		</SectionPanel>
	)
}
