import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MdPets } from 'react-icons/md'
import { TbApps, TbCalendarUser, TbCurrencyDollar, TbNews, TbSearch } from 'react-icons/tb'
import { TiWeatherCloudy } from 'react-icons/ti'
import { VscSettings } from 'react-icons/vsc'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent } from '@/common/utils/call-event'
import Modal from '@/components/modal'
import { TabItem, TabManager } from '@/components/tab-manager'
import { PetSettings } from '../widgetify-card/pets/setting/pet-setting'
import { RssFeedSetting } from '../widgets/news/rss-feed-setting'
import { WeatherSetting } from '../widgets/weather/weather-setting'
import { WigiArzSetting } from '../widgets/wigiArz/wigiArz-setting'
import { TimeAndDateSetting } from '../widgets/timeAndDate/TimeandDateWidget-setting'
import { WidgetTabKeys } from './constant/tab-keys'
import { ManageWidgets } from './manage-widgets/manage-widgets'
import { TabFrixBrand } from '@/components/tabfrix-brand'
import { SearchAndBookmarksSetting } from './search-and-bookmarks/search-and-bookmarks-setting'

interface WidgetSettingsModalProps {
	isOpen: boolean
	onClose: () => void
	selectedTab: string | null
}

export function WidgetSettingsModal({
	isOpen,
	onClose,
	selectedTab,
}: WidgetSettingsModalProps) {
	const { t, i18n } = useTranslation()
	const isRtl = i18n.language.startsWith('fa')
	const [activeTab, setActiveTab] = useState(WidgetTabKeys.widget_management)
	const tabs: TabItem[] = useMemo(
		() => [
			{
				parentName: <TabFrixBrand variant="sidebar" />,
				children: [
					{
						label: t('settings.widgets.tabs.widgetManagement'),
						element: <ManageWidgets />,
						value: WidgetTabKeys.widget_management,
						icon: <TbApps size={20} />,
					},
					{
						label: t('settings.widgets.tabs.timeCalendar'),
						element: <TimeAndDateSetting />,
						value: WidgetTabKeys.TimeandDate,
						icon: <TbCalendarUser size={20} />,
					},
					{
						label: t('settings.widgets.tabs.currency'),
						element: <WigiArzSetting />,
						value: WidgetTabKeys.wigiArz,
						icon: <TbCurrencyDollar size={20} />,
					},
					{
						label: t('settings.widgets.tabs.news'),
						element: <RssFeedSetting />,
						value: WidgetTabKeys.news_settings,
						icon: <TbNews size={20} />,
					},
					{
						label: t('settings.widgets.tabs.weather'),
						element: <WeatherSetting />,
						value: WidgetTabKeys.weather_settings,
						icon: <TiWeatherCloudy size={20} />,
					},
					{
						label: t('settings.widgets.tabs.pet'),
						value: WidgetTabKeys.Pet,
						icon: <MdPets size={20} />,
						element: <PetSettings />,
					},
					{
						label: t('settings.widgets.tabs.searchAndBookmarks'),
						value: WidgetTabKeys.searchAndBookmarks_settings,
						icon: <TbSearch size={20} />,
						element: <SearchAndBookmarksSetting />,
					},
				],
			},
		],
		[t]
	)

	useEffect(() => {
		if (!isOpen) return
		if (selectedTab) {
			setActiveTab(selectedTab as WidgetTabKeys)
			return
		}

		async function loadLastTab() {
			const storedTab = await getFromStorage('widgets_settings_tab')
			if (storedTab) {
				setActiveTab(storedTab as WidgetTabKeys)
			} else {
				setActiveTab(WidgetTabKeys.widget_management)
			}
		}

		void loadLastTab()
	}, [isOpen, selectedTab])

	const handleTabChange = (tabValue: string) => {
		setActiveTab(tabValue as WidgetTabKeys)
		void setToStorage('widgets_settings_tab', tabValue)
	}

	function onClickSettings() {
		onClose()
		callEvent('openSettings')
		Analytics.event('open_settings_from_widgets_settings_modal')
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('settings.widgets.modalTitle')}
			size="xl"
			direction={isRtl ? 'rtl' : 'ltr'}
			closeOnBackdropClick={true}
		>
			<TabManager
				tabs={tabs}
				tabOwner="widgets-settings"
				defaultTab={selectedTab || activeTab || WidgetTabKeys.widget_management}
				selectedTab={selectedTab || activeTab}
				onTabChange={handleTabChange}
				direction={isRtl ? 'rtl' : 'ltr'}
			>
				<button
					className={`relative  items-center flex gap-3 px-4 py-3 rounded-full transition-all duration-200 ease-in-out justify-start cursor-pointer whitespace-nowrap active:scale-[0.98] text-muted hover:bg-base-300 w-42`}
					onClick={() => {
						onClickSettings()
					}}
				>
					<VscSettings size={20} className="text-muted" />
					<span className="text-sm font-light">{t('settings.title')}</span>
				</button>
			</TabManager>
		</Modal>
	)
}
