import { useEffect, useState } from 'react'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent, listenEvent } from '@/common/utils/call-event'
import { Button } from '@/components/button/button'
import { WidgetTabKeys } from '@/layouts/widgets-settings/constant/tab-keys'
import { FaCog } from 'react-icons/fa'
import { useGetUserProfile } from '@/services/hooks/user/userService.hook'
import type {
	FetchedForecast,
	FetchedWeather,
	WeatherSettings,
} from '@/layouts/widgets/weather/weather.interface'
import { WidgetContainer } from '../widget-container'
import { Forecast } from './forecast/forecast'
import { CurrentWeatherBox } from './current/current-box.weather'
import { useGetWeatherByLatLon } from '@/services/hooks/weather/getWeatherByLatLon'
import { useGeolocation } from '@/services/hooks/geo/useGeolocation'

export function WeatherLayout() {
	const { data: user } = useGetUserProfile()
	const { latitude, longitude, loading: geoLoading } = useGeolocation()
	const [weatherSettings, setWeatherSettings] = useState<WeatherSettings | null>(null)
	const [weatherState, setWeather] = useState<FetchedWeather | null>(null)
	const [forecastWeather, setForecastWeather] = useState<FetchedForecast[] | null>(null)

	// Determine final coordinates: Priority is Current Location > Selected City > Default (Tehran)
	const finalLat = latitude ?? user?.city?.lat ?? 35.696111
	const finalLon = longitude ?? user?.city?.lon ?? 51.423056

	const {
		data,
		dataUpdatedAt,
		refetch: refetchWeather,
	} = useGetWeatherByLatLon({
		refetchInterval: 0,
		units: weatherSettings?.temperatureUnit,
		useAI: weatherSettings?.useAI,
		lat: finalLat,
		lon: finalLon,
		enabled: !geoLoading, // Wait for geolocation if it's still loading
	})

	useEffect(() => {
		async function load() {
			const [
				weatherSettingFromStorage,
				currentWeatherFromStorage,
				forecastWeatherFromStorage,
			] = await Promise.all([
				getFromStorage('weatherSettings'),
				getFromStorage('currentWeather'),
				getFromStorage('forecastWeather'),
			])

			if (currentWeatherFromStorage) {
				setWeather(currentWeatherFromStorage)
			}
			if (forecastWeatherFromStorage) {
				setForecastWeather(forecastWeatherFromStorage)
			}

			if (weatherSettingFromStorage) {
				setWeatherSettings(weatherSettingFromStorage)
			} else {
				setWeatherSettings({
					useAI: true,
					forecastCount: 4,
					temperatureUnit: 'metric',
					enableShowName: true,
				})
			}
		}

		const event = listenEvent('weatherSettingsChanged', (data) => {
			setWeatherSettings(data)
		})

		load()

		return () => {
			event()
		}
	}, [])

	useEffect(() => {
		if (data) {
			setToStorage('currentWeather', data)
			setToStorage('forecastWeather', data.forecast)
			setWeather(data)
			setForecastWeather(data.forecast)
		}
	}, [data, dataUpdatedAt])


	useEffect(() => {
		if (latitude !== null || user?.city?.lat) {
			refetchWeather()
		}
	}, [latitude, longitude, user?.city?.lat, user?.city?.lon, refetchWeather])

	if (!weatherSettings) return null

	const onClickSettings = () => {
		callEvent('openWidgetsSettings', { tab: WidgetTabKeys.weather_settings })
	}

	return (
		<WidgetContainer className="relative group">
			<div className="absolute inset-0 z-20">
				<Button
					size="xs"
					className="m-1.5 h-5 w-5 p-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 !border-none !shadow-none transition-all duration-300 delay-200"
					onClick={onClickSettings}
				>
					<FaCog size={12} className="text-content" />
				</Button>
			</div>
			<div className="flex flex-col w-full h-full gap-2 py-1">
				<CurrentWeatherBox
					fetchedWeather={weatherState || null}
					temperatureUnit={weatherSettings.temperatureUnit}
				/>

				<div className="flex justify-between gap-0.5 px-1  rounded-2xl bg-base-200/40">
					<Forecast
						temperatureUnit={weatherSettings.temperatureUnit}
						forecast={forecastWeather}
					/>
				</div>
			</div>
		</WidgetContainer>
	)
}
