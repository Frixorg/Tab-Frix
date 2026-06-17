// The on-the-wire contract consumed by the Tab Frix extension
// (src/services/hooks/date/getEvents.hook.ts). Keep these in sync.

export type Calendar = 'shamsi' | 'gregorian' | 'hijri'

export interface FetchedEvent {
	isHoliday: boolean
	title: string
	day: number
	month: number
	icon: string | null // e.g. https://.../icon.png|gif|jpg
}

export interface FetchedAllEvents {
	shamsiEvents: FetchedEvent[]
	gregorianEvents: FetchedEvent[]
	hijriEvents: FetchedEvent[]
}

export const EMPTY_EVENTS: FetchedAllEvents = {
	shamsiEvents: [],
	gregorianEvents: [],
	hijriEvents: [],
}
