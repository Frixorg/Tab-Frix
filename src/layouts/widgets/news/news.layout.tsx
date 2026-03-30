import { useEffect, useState } from 'react'
import { getFromStorage } from '@/common/storage'
import { callEvent, listenEvent } from '@/common/utils/call-event'
import { WidgetTabKeys } from '@/layouts/widgets-settings/constant/tab-keys'
import { FaCog } from 'react-icons/fa'
import { Button } from '@/components/button/button'
import { WidgetContainer } from '../widget-container'
import { NewsContainer } from './components/news-container'
import { NewsHeader } from './components/news-header'
import type { WigiNewsSetting } from './rss.interface'

interface NewsLayoutProps {
	inComboWidget: boolean
	enableBackground?: boolean
}

export const NewsLayout: React.FC<NewsLayoutProps> = ({
	enableBackground = true,
	inComboWidget,
}) => {
	const [rssState, setRssState] = useState<WigiNewsSetting>({
		customFeeds: [],
		useDefaultNews: true,
		lastFetchedItems: {},
	})

	useEffect(() => {
		async function loadInitialData() {
			const data = await getFromStorage('rssOptions')
			if (data) {
				setRssState({
					customFeeds: data.customFeeds,
					useDefaultNews: data.useDefaultNews,
					lastFetchedItems: {},
				})
			}
		}

		const event = listenEvent(
			'wigiNewsSettingsChanged',
			async (data: WigiNewsSetting) => {
				setRssState(structuredClone(data))
			}
		)

		loadInitialData()
		return () => {
			event()
		}
	}, [])

	return (
		<>
			{inComboWidget ? (
				<div className="flex flex-col gap-2 mt-1 overflow-y-auto min-h-52 scrollbar-none">
					<NewsContainer
						customFeeds={rssState.customFeeds}
						useDefaultNews={rssState.useDefaultNews}
					/>
				</div>
			) : (
				<WidgetContainer
					background={enableBackground}
					className={'relative flex flex-col gap-1 px-2 py-2 overflow-y-auto group'}
					style={{
						scrollbarWidth: 'none',
					}}
				>
					<div className="absolute inset-0 z-20">
						<Button
							size="xs"
							className="m-1.5 h-5 w-5 p-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 !border-none !shadow-none transition-all duration-300 delay-200"
							onClick={() =>
								callEvent('openWidgetsSettings', {
									tab: WidgetTabKeys.news_settings,
								})
							}
						>
							<FaCog size={12} className="text-content" />
						</Button>
					</div>
					<NewsHeader
						title="ویجی نیوز"
						onSettingsClick={() =>
							callEvent('openWidgetsSettings', {
								tab: WidgetTabKeys.news_settings,
							})
						}
					/>

					<NewsContainer
						customFeeds={rssState.customFeeds}
						useDefaultNews={rssState.useDefaultNews}
					/>
				</WidgetContainer>
			)}
		</>
	)
}
