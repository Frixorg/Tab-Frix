export interface IpApiFields {
	status: 'success' | 'fail'
	message?: string
	country?: string
	countryCode?: string
	regionName?: string
	city?: string
	timezone?: string
	query?: string
}

const IP_API_URL =
	'http://ip-api.com/json/?fields=status,message,country,countryCode,regionName,city,timezone,query'

export async function fetchIpLocation(): Promise<IpApiFields | null> {
	try {
		const res = await fetch(IP_API_URL)
		if (!res.ok) return null
		const data = (await res.json()) as IpApiFields
		if (data.status !== 'success' || !data.timezone) return null
		return data
	} catch {
		return null
	}
}
