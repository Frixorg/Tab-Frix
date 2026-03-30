import { useQuery } from '@tanstack/react-query'
import ms from 'ms'
import { fetchOpenMeteoWeather } from '@/services/api/open-meteo'
import type { FetchedWeather } from '../../../layouts/widgets/weather/weather.interface'

async function fetchWeatherByLatLon(op: GetWeatherByLatLon): Promise<FetchedWeather> {
	const lat = op.lat ?? 35.696111
	const lon = op.lon ?? 51.423056
	return fetchOpenMeteoWeather(lat, lon, op.units === 'imperial' ? 'imperial' : 'metric')
}

type GetWeatherByLatLon = {
	units?: 'standard' | 'metric' | 'imperial'
	useAI?: boolean
	refetchInterval: number | null
	enabled: boolean
	lat?: number
	lon?: number
}
export function useGetWeatherByLatLon(options: GetWeatherByLatLon) {
	return useQuery({
		queryKey: ['getWeatherByLatLon', options],
		queryFn: () => fetchWeatherByLatLon(options),
		refetchInterval: options?.refetchInterval || false,
		enabled: options.enabled,
		staleTime: ms('5m'),
		gcTime: ms('5m'),
	})
}
