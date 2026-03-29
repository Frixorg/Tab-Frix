import { slugifyCityId } from '@/services/hooks/cities/getCitiesList'
import {
	getTimezones,
	type FetchedTimezone,
} from '@/services/hooks/timezone/getTimezones.hook'
import { buildTimezoneFromIana } from './timezone-from-iana'
import { fetchIpLocation } from './ip-api'

export interface GeoDefaultsResult {
	timezone: FetchedTimezone
	/** Slug derived from ip-api `city` (same format as legacy city ids). */
	cityId: string | null
	cityName: string | null
}

/**
 * Uses only [ip-api.com](http://ip-api.com/json/) for IP location (timezone + city name).
 * City id for the API is a slug from the detected city string — no external city databases.
 */
export async function resolveGeoDefaults(): Promise<GeoDefaultsResult | null> {
	const ip = await fetchIpLocation()
	if (!ip?.timezone) return null

	const zones = await getTimezones()
	const timezone = buildTimezoneFromIana(ip.timezone, zones)

	const cityId =
		ip.city && ip.city.trim().length > 0 ? slugifyCityId(ip.city) : null
	const cityName = ip.city?.trim() ? ip.city.trim() : null

	return { timezone, cityId, cityName }
}
