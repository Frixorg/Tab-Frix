import { useQuery } from '@tanstack/react-query'

export interface FetchedTimezone {
	label: string
	value: string
	offset: string
}

export async function getTimezones(): Promise<FetchedTimezone[]> {
	try {
		// Use IANA timezone database via GitHub (always available, no auth needed)
		const response = await fetch(
			'https://raw.githubusercontent.com/moment-timezone/moment-timezone/develop/data/packed/latest.json'
		)
		if (response.ok) {
			const data = await response.json()
			if (data.zones && Array.isArray(data.zones)) {
				// Parse IANA timezones
				return data.zones.map((zone: string) => ({
					label: zone.replace(/_/g, ' '),
					value: zone,
					offset: '±00:00', // Offset would require additional timezone data
				}))
			}
		}
	} catch (error) {
		console.warn('Failed to fetch timezones from IANA database, trying alternative source', error)
	}

	// Fallback: use Intl API to get browser's available timezones
	try {
		const timeZones = Intl.supportedValuesOf('timeZone')
		if (timeZones && Array.isArray(timeZones)) {
			return timeZones.map((tz) => ({
				label: tz.replace(/_/g, ' '),
				value: tz,
				offset: '±00:00',
			}))
		}
	} catch (error) {
		console.warn('Intl API not available', error)
	}

	// Final fallback: minimal timezone list
	return [
		{ label: 'UTC', value: 'UTC', offset: '+00:00' },
		{ label: 'America New York', value: 'America/New_York', offset: '-05:00' },
		{ label: 'America Chicago', value: 'America/Chicago', offset: '-06:00' },
		{ label: 'America Denver', value: 'America/Denver', offset: '-07:00' },
		{ label: 'America Los Angeles', value: 'America/Los_Angeles', offset: '-08:00' },
		{ label: 'Europe London', value: 'Europe/London', offset: '+00:00' },
		{ label: 'Europe Paris', value: 'Europe/Paris', offset: '+01:00' },
		{ label: 'Europe Moscow', value: 'Europe/Moscow', offset: '+03:00' },
		{ label: 'Asia Dubai', value: 'Asia/Dubai', offset: '+04:00' },
		{ label: 'Asia Tehran', value: 'Asia/Tehran', offset: '+03:30' },
		{ label: 'Asia Kolkata', value: 'Asia/Kolkata', offset: '+05:30' },
		{ label: 'Asia Bangkok', value: 'Asia/Bangkok', offset: '+07:00' },
		{ label: 'Asia Shanghai', value: 'Asia/Shanghai', offset: '+08:00' },
		{ label: 'Asia Tokyo', value: 'Asia/Tokyo', offset: '+09:00' },
		{ label: 'Australia Sydney', value: 'Australia/Sydney', offset: '+10:00' },
		{ label: 'Pacific Auckland', value: 'Pacific/Auckland', offset: '+12:00' },
	]
}

export function useTimezones(enabled: boolean = true) {
	return useQuery<FetchedTimezone[]>({
		queryKey: ['timezones'],
		queryFn: getTimezones,
		enabled,
		gcTime: 1000 * 60 * 5, // 5 minutes
	})
}
