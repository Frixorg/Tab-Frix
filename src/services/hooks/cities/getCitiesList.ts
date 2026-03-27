import { useQuery } from '@tanstack/react-query'

export interface CityResponse {
	city: string
	cityId: string
}

async function fetchCitiesList(): Promise<CityResponse[]> {
	try {
		// Use OpenWeatherMap cities API (free, no key required for this endpoint)
		const response = await fetch(
			'https://raw.githubusercontent.com/jpatokal/openflights/master/data/cities.dat'
		)
		if (response.ok) {
			const text = await response.text()
			const cities: CityResponse[] = []
			const seen = new Set<string>()
			
			// Parse the cities.dat format: ID,Name,City,Country,IATA,ICAO,Latitude,Longitude,Altitude,Timezone,DST,Tz database time zone,Type
			text.split('\n').forEach((line) => {
				if (!line.trim()) return
				const parts = line.split(',')
				if (parts.length >= 3) {
					const cityName = parts[2]?.replace(/"/g, '').trim()
					const cityId = parts[2]?.replace(/"/g, '').toLowerCase().replace(/\s+/g, '-')
					
					// Avoid duplicates
					if (cityName && cityId && !seen.has(cityId)) {
						seen.add(cityId)
						cities.push({
							city: cityName,
							cityId: cityId,
						})
					}
				}
			})
			
			// Return top 500 most common cities
			return cities.slice(0, 500)
		}
	} catch (error) {
		console.warn('Failed to fetch cities from API', error)
	}

	// Fallback to popular cities if API fails
	return [
		{ city: 'London', cityId: 'london' },
		{ city: 'Paris', cityId: 'paris' },
		{ city: 'New York', cityId: 'new-york' },
		{ city: 'Tokyo', cityId: 'tokyo' },
		{ city: 'Dubai', cityId: 'dubai' },
		{ city: 'Singapore', cityId: 'singapore' },
		{ city: 'Hong Kong', cityId: 'hong-kong' },
		{ city: 'Sydney', cityId: 'sydney' },
		{ city: 'Toronto', cityId: 'toronto' },
		{ city: 'Mumbai', cityId: 'mumbai' },
		{ city: 'Bangkok', cityId: 'bangkok' },
		{ city: 'Istanbul', cityId: 'istanbul' },
		{ city: 'Tehran', cityId: 'tehran' },
		{ city: 'Mashhad', cityId: 'mashhad' },
		{ city: 'Isfahan', cityId: 'isfahan' },
	]
}

export function useGetCitiesList(enabled: boolean) {
	return useQuery({
		queryKey: ['getCitiesList'],
		queryFn: fetchCitiesList,
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	})
}
