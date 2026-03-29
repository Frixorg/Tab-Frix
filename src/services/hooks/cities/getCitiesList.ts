import { useQuery } from '@tanstack/react-query'

export interface CityResponse {
	city: string
	cityId: string
}

// Format: [id, cityName, country]
type CityDatasetItem = [number | string, string, string]

export function slugifyCityId(cityName: string): string {
	return cityName.trim().toLowerCase().replace(/\s+/g, '-')
}

const BUILTIN_CITIES: CityResponse[] = [
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
	{ city: 'Rome', cityId: 'rome' },
	{ city: 'Milan', cityId: 'milan' },
	{ city: 'Tehran', cityId: 'tehran' },
	{ city: 'Mashhad', cityId: 'mashhad' },
	{ city: 'Isfahan', cityId: 'isfahan' },
]

let cityListCache: CityResponse[] | null = null

export async function fetchCitiesList(): Promise<CityResponse[]> {
	if (cityListCache) return cityListCache

	const getRuntimeUrl =
		typeof browser !== 'undefined'
			? (browser.runtime?.getURL as unknown as ((path: string) => string) | undefined)
			: undefined

	const runtimeUrl = getRuntimeUrl?.('data/cities.json') ?? '/data/cities.json'

	let text: string
	try {
		const res = await fetch(runtimeUrl)
		if (!res.ok) return BUILTIN_CITIES
		text = await res.text()
	} catch {
		return BUILTIN_CITIES
	}

	let payload: unknown
	try {
		payload = JSON.parse(text)
	} catch {
		return BUILTIN_CITIES
	}

	if (!Array.isArray(payload)) return BUILTIN_CITIES

	const cities: CityResponse[] = []

	for (const item of payload as CityDatasetItem[]) {
		const cityName = (item[1] ?? '').trim()
		if (!cityName) continue

		cities.push({
			city: cityName,
			cityId: String(item[0] ?? slugifyCityId(cityName)),
		})
	}

	cityListCache = cities.length > 0 ? cities : BUILTIN_CITIES
	return cityListCache
}

export function useGetCitiesList(enabled: boolean) {
	return useQuery({
		queryKey: ['getCitiesList'],
		queryFn: fetchCitiesList,
		enabled,
		staleTime: Infinity,
		gcTime: Infinity,
	})
}
