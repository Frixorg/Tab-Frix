import { getMainClient } from '@/services/api'
import { useLanguage } from '@/context/language.context'
import { useQuery } from '@tanstack/react-query'

export interface FetchedEvent {
	isHoliday: boolean
	title: string
	day: number
	month: number
	icon: string | null //e.g https://.../icon.png|gif|jpg
}
export interface FetchedAllEvents {
	shamsiEvents: FetchedEvent[]
	gregorianEvents: FetchedEvent[]
	hijriEvents: FetchedEvent[]
}

export const useGetEvents = () => {
	const { lang } = useLanguage()
	return useQuery<FetchedAllEvents>({
		queryKey: ['get-events', lang],
		queryFn: async () => getEvents(lang),
		retry: 0,
		staleTime: 10 * 60 * 1000,
	})
}

async function getEvents(lang: string): Promise<FetchedAllEvents> {
	const client = await getMainClient()
	const { data } = await client.get<FetchedAllEvents>('/date/events', {
		params: { lang },
	})
	return data ?? []
}
