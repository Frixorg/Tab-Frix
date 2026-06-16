import jalaliMoment from 'jalali-moment'
import { useRef } from 'react'
import Analytics from '@/analytics'
import type { FetchedAllEvents } from '@/services/hooks/date/getEvents.hook'
import type { GoogleCalendarEvent } from '@/services/hooks/date/getGoogleCalendarEvents.hook'
import type { MoodEntry } from '@/services/hooks/moodLog/get-moods.hook'
import {
	formatDateStr,
	getCurrentDate,
	getGregorianEvents,
	getHijriEvents,
	getShamsiEvents,
} from '../../utils'
import { moodOptions } from '@/common/constant/moods'
import { useLanguage } from '@/context/language.context'

interface DayItemProps {
	day: number
	currentDate: jalaliMoment.Moment
	isJalali: boolean
	events: FetchedAllEvents
	selectedDateStr: string
	setSelectedDate: (date: jalaliMoment.Moment) => void
	googleEvents: GoogleCalendarEvent[]
	timezone: string
	moods: MoodEntry[]
	onClick?: (element: HTMLDivElement) => void
}

export function DayItem({
	day,
	currentDate,
	isJalali,
	events,
	selectedDateStr,
	setSelectedDate,
	timezone,
	moods,
	onClick,
}: DayItemProps) {
	const dayRef = useRef<HTMLDivElement>(null)
	const { t } = useLanguage()
	const cellDate = isJalali
		? currentDate.clone().jDate(day)
		: currentDate.clone().date(day)
	const dateStr = formatDateStr(cellDate)
	// Shamsi + Hijri events belong to the Jalali calendar only. In Gregorian mode we
	// show Gregorian events exclusively so Hijri/Shamsi days never leak in.
	const todayShamsiEvents = isJalali ? getShamsiEvents(events, cellDate) : []
	const todayHijriEvents = isJalali ? getHijriEvents(events, cellDate) : []
	const todayGregorianEvents = getGregorianEvents(events, cellDate)

	const holidayEvents = isJalali
		? [...todayShamsiEvents, ...todayHijriEvents]
		: todayGregorianEvents

	const hasEvent =
		todayShamsiEvents.length +
		todayHijriEvents.length +
		todayGregorianEvents.length
	const eventIcons = [
		...todayGregorianEvents.filter((event) => event.icon).map((event) => event.icon),
		...todayShamsiEvents.filter((event) => event.icon).map((event) => event.icon),
		...todayHijriEvents.filter((event) => event.icon).map((event) => event.icon),
	].filter(Boolean) as string[]

	const isSelected = selectedDateStr === dateStr
	const isCurrentDay = isToday(cellDate, timezone, isJalali)

	const isHoliday =
		(isJalali && cellDate.day() === 5) ||
		holidayEvents.some((event) => event.isHoliday)

	const isHolidayEvent = holidayEvents.some((event) => event.isHoliday)

	const moodForDay = moods.find(
		(mood) => mood.date === cellDate.doAsGregorian().format('YYYY-MM-DD')
	)
	const hasMood = !!moodForDay
	const dayMood = moodOptions.find((m) => m.value === moodForDay?.mood)

	const getMoodRingStyle = () => {
		if (!hasMood || !dayMood?.value) return ''
		return `border-2 ${dayMood.borderClass}`
	}

	const getDayTextStyle = () => {
		if (isHoliday) {
			return 'text-error bg-error/10'
		}

		return 'text-content'
	}

	const getSelectedDayStyle = () => {
		if (isHoliday) {
			return 'bg-error/10'
		}

		return 'bg-primary/20'
	}

	const getHoverStyle = () => {
		if (isHoliday) {
			return 'hover:bg-red-400/10'
		}

		return 'hover:bg-primary/10'
	}

	const getTodayRingStyle = () => {
		if (hasMood) return ''

		if (isHoliday) {
			return 'border border-dashed border-error/80'
		}

		return 'border border-dashed border-primary/80'
	}

	function onClickHandler() {
		Analytics.event('calendar_day_click')
		setSelectedDate(cellDate)
		if (onClick && dayRef.current) {
			onClick(dayRef.current)
		}
	}

	const renderIndicators = () => {
		if (eventIcons.length > 0) {
			return (
				<img
					src={eventIcons[0]}
					alt={t('widgets.calendar.eventAlt')}
					className="object-contain w-6 h-6 transition-all rounded-full"
					loading="lazy"
				/>
			)
		}

		if (!hasEvent) return null

		return (
			<div className="flex items-center">
				{hasEvent && (
					<span
						className={`w-0.5 h-0.5 rounded-full ${isHolidayEvent ? 'bg-red-500' : 'bg-blue-500/80'} shadow-sm`}
					/>
				)}
			</div>
		)
	}

	return (
		<div
			onClick={onClickHandler}
			ref={dayRef}
			className={`
				relative p-0 rounded-2xl text-xs transition-all cursor-pointer
				h-6 w-6 mx-auto flex items-center justify-center hover:scale-110 hover:shadow
				${getDayTextStyle()}
				${isSelected ? getSelectedDayStyle() : getHoverStyle()}
				${isCurrentDay && `${getTodayRingStyle()} scale-110 shadow-lg`}
				${getMoodRingStyle()}
			`}
		>
			{day}
			{
				<div className="absolute flex flex-wrap items-center justify-center w-full gap-0.5 -translate-x-1/2 bottom-0.5 left-1/2">
					{renderIndicators()}
				</div>
			}
		</div>
	)
}

const isToday = (date: jalaliMoment.Moment, timezone: string, isJalali = true) => {
	const today = getCurrentDate(timezone)
	return isJalali
		? date.jDate() === today.jDate() &&
				date.jMonth() === today.jMonth() &&
				date.jYear() === today.jYear()
		: date.date() === today.date() &&
				date.month() === today.month() &&
				date.year() === today.year()
}
