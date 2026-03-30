import { getMainClient } from '@/services/api'
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
	return useQuery<FetchedAllEvents>({
		queryKey: ['get-events'],
		queryFn: async () => ({
			shamsiEvents: [],
			gregorianEvents: [],
			hijriEvents: [],
		}),
		retry: 0,
		staleTime: 10 * 60 * 1000,
	})
}
