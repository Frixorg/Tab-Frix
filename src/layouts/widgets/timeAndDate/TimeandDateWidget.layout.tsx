import { useEffect, useRef, useState } from 'react'
import { getFromStorage } from '@/common/storage'
import { listenEvent } from '@/common/utils/call-event'
import { TabNavigation } from '@/components/tab-navigation'
import { useGetUserProfile } from '@/services/hooks/user/userService.hook'
import { useGetWeatherByLatLon } from '@/services/hooks/weather/getWeatherByLatLon'
import { useGeolocation } from '@/services/hooks/geo/useGeolocation'
import { WidgetContainer } from '../widget-container'
import { ClockDisplay } from './clock-display/clock-display'
import { DateDisplay } from './date-display/date.display'
import { useInfoPanelData } from './info-panel/hooks/useInfoPanelData'
import { MdOutlineCloud, MdOutlineTab } from 'react-icons/md'
import { InfoWeather } from './info-panel/infoWeather'
import { NotificationItem } from './info-panel/components/ann-item'
import { CurrentWeatherBox } from '../weather/current/current-box.weather'
import type { WeatherSettings } from '../weather/weather.interface'
import type { WigiPadDateSetting } from './date-display/date-setting.interface'
import { Pet } from '../../widgetify-card/pets/pet'
import { PetProvider } from '../../widgetify-card/pets/pet.context'
const sections: any[] = [
	// { id: 'all', label: 'ویجی تب', icon: <MdOutlineTab size={14} /> },
	// { id: 'weather', label: 'آب و هوا', icon: <MdOutlineCloud size={14} /> },
]

export function TimeAndDateLayout() {
	const [activeSection, setActiveSection] = useState<string>('all')
	const [wigiPadSettings, setWigiPadSettings] = useState<WigiPadDateSetting | null>(null)
	const [weatherSettings, setWeatherSettings] = useState<WeatherSettings | null>(null)
	const { data: user } = useGetUserProfile()
	const { latitude: geoLat, longitude: geoLon, loading: geoLoading } = useGeolocation()
	const data = useInfoPanelData()
	const tabContainerRef = useRef<HTMLDivElement>(null)

	const finalLat = geoLat || user?.city?.lat || 35.696111
	const finalLon = geoLon || user?.city?.lon || 51.423056

	const { data: weather } = useGetWeatherByLatLon({
		lat: finalLat,
		lon: finalLon,
		units: weatherSettings?.temperatureUnit || 'metric',
		enabled: !!wigiPadSettings?.showWeather && !geoLoading,
		refetchInterval: 0,
	})

	useEffect(() => {
		async function load() {
			const settings = await getFromStorage('wigiPadDate')
			if (settings) setWigiPadSettings(settings)

			const wSettings = await getFromStorage('weatherSettings')
			if (wSettings) setWeatherSettings(wSettings)
		}
		load()

		const event = listenEvent('wigiPadDateSettingsChanged', (newSettings) => {
			setWigiPadSettings(newSettings)
		})

		const wEvent = listenEvent('weatherSettingsChanged', (newWSettings) => {
			setWeatherSettings(newWSettings)
		})

		return () => {
			event()
			wEvent()
		}
	}, [])

	const renderContent = () => {
		switch (activeSection) {
			case 'weather':
				return <InfoWeather />

			default:
				return (
					<div className="grid grid-cols-2 grid-rows-[auto_1fr] gap-x-2 h-full">
						<DateDisplay />
						<ClockDisplay />
						{wigiPadSettings?.showWeather && weather && (
							<div className="col-span-2 mt-1 overflow-hidden">
								<div className="mb-2 origin-top">
									<CurrentWeatherBox
										fetchedWeather={weather}
										temperatureUnit={
											weatherSettings?.temperatureUnit || 'metric'
										}
										showWindHumidity={false}
									/>
								</div>

								<div
									className={`overflow-y-auto scrollbar-none ${wigiPadSettings?.showWeather
										? 'max-h-12'
										: 'max-h-24 min-h-24'
										}`}
								>
									{data.notifications.map((notification, index) => (
										<NotificationItem
											key={index}
											notification={notification}
										/>
									))}
								</div>
							</div>
						)}
					</div>
				)
		}
	}

	return (
		<WidgetContainer isCustomHeight={!wigiPadSettings?.showWeather} className={`flex flex-col !p-2 `}>

			<div className="flex-1 relative h-60">
				{/* {
					<PetProvider>
						<Pet />
					</PetProvider>
				} */}
				{renderContent()}</div>
		</WidgetContainer>
	)
}
