import { useQuery } from '@tanstack/react-query'
import ms from 'ms'
import { getFromStorage } from '@/common/storage'
import { fetchOpenMeteoWeather } from '@/services/api/open-meteo'
import type { FetchedWeather } from '../../../layouts/widgets/weather/weather.interface'

async function fetchWeatherByLatLon(op: GetWeatherByLatLon): Promise<FetchedWeather> {
	const lat = op.lat ?? 35.696111
	const lon = op.lon ?? 51.423056
	const units = op.units === 'imperial' ? 'imperial' : 'metric'

	const today = new Date().toISOString().split('T')[0]
	const cached = await getFromStorage('currentWeather')

	if (cached && cached.fetchedAt === today) {
		// If same day, check if location is roughly the same (tolerance ~1km)
		const latDiff = Math.abs((cached.lat ?? 0) - lat)
		const lonDiff = Math.abs((cached.lon ?? 0) - lon)

		if (latDiff < 0.01 && lonDiff < 0.01) {
			return cached
		}
	}

	const data = await fetchOpenMeteoWeather(lat, lon, units)
	data.fetchedAt = today
	data.lat = lat
	data.lon = lon

	return data
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
		queryKey: [
			'getWeatherByLatLon',
			options.lat,
			options.lon,
			options.units === 'imperial' ? 'imperial' : 'metric',
		],
		queryFn: () => fetchWeatherByLatLon(options),
		refetchInterval: options?.refetchInterval || false,
		enabled: options.enabled,
		staleTime: ms('5m'),
		gcTime: ms('5m'),
	})
}
