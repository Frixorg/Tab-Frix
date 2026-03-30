import { useQuery } from '@tanstack/react-query'
import { fetchOpenMeteoWeather } from '@/services/api/open-meteo'
import type {
	FetchedForecast,
	TemperatureUnit,
} from '../../../layouts/widgets/weather/weather.interface'

interface Options {
	refetchInterval: number | null
	count?: number
	units?: TemperatureUnit
	enabled: boolean
	lat?: number
	lon?: number
}

async function fetchForecastWeatherByLatLon(
	options: Options
): Promise<FetchedForecast[]> {
	const lat = options.lat ?? 35.696111
	const lon = options.lon ?? 51.423056
	const weather = await fetchOpenMeteoWeather(
		lat,
		lon,
		options.units === 'imperial' ? 'imperial' : 'metric'
	)
	return weather.forecast
}

export function useGetForecastWeatherByLatLon(options: Options) {
	return useQuery({
		queryKey: ['ForecastGetWeatherByLatLon', options],
		queryFn: () => fetchForecastWeatherByLatLon(options),
		refetchInterval: options.refetchInterval || false,
		enabled: options.enabled,
	})
}
