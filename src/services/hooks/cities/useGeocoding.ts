import { useQuery } from '@tanstack/react-query'

export interface GeocodingCity {
	id: number
	name: string
	latitude: number
	longitude: number
	country: string
	admin1?: string
}

async function fetchGeocoding(name: string): Promise<GeocodingCity[]> {
	if (!name || name.trim().length < 2) return []

	const response = await fetch(
		`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
			name
		)}&count=10&language=en&format=json`
	)
	if (!response.ok) return []

	const data = await response.json()
	return data.results || []
}

export function useGeocoding(name: string) {
	return useQuery({
		queryKey: ['geocoding', name],
		queryFn: () => fetchGeocoding(name),
		enabled: name.trim().length >= 2,
		staleTime: 1000 * 60 * 60, // 1 hour
	})
}
