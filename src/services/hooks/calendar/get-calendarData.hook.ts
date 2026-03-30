import { useQuery } from '@tanstack/react-query'
import type { GoogleCalendarEvent } from '../date/getGoogleCalendarEvents.hook'

export interface FetchedUserMood {
	mood: 'sad' | 'normal' | 'happy' | 'excited'
	date: string // "2025-11-20"
}

export interface GetCalendarDataResponse {
	moods: FetchedUserMood[]
	googleEvents: GoogleCalendarEvent[]
}

export const useGetCalendarData = (start: string, end: string) => {
	return useQuery<GetCalendarDataResponse>({
		queryKey: ['get-calendar-data', start, end],
		queryFn: async () => getCalendarData(start, end),
		retry: 0,
		enabled: !!start && !!end,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
	})
}

async function getCalendarData(
	start: string,
	end: string
): Promise<GetCalendarDataResponse> {
	return { moods: [], googleEvents: [] }
}
