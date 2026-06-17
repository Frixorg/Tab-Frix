import { useAuth } from '@/context/auth.context'
import { useLanguage } from '@/context/language.context'
import { useDate } from '@/context/date.context'
import { useGeneralSetting } from '@/context/general-setting.context'
import { useGetEvents } from '@/services/hooks/date/getEvents.hook'
import type React from 'react'
import { useState } from 'react'
import { type WidgetifyDate, formatDateStr } from '../utils'
import { DayItem } from './day/day'
import { ClickableTooltip } from '@/components/clickableTooltip'
import { CalendarDayDetails } from './day/toolTipContent'
import { useGetCalendarData } from '@/services/hooks/calendar/get-calendarData.hook'

const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

interface CalendarGridProps {
	currentDate: WidgetifyDate
	selectedDate: WidgetifyDate
	setSelectedDate: (date: WidgetifyDate) => void
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
	currentDate,
	selectedDate,
	setSelectedDate,
}) => {
	const { isAuthenticated } = useAuth()
	const { t } = useLanguage()
	const { isJalali } = useDate()
	const [isOpenTooltip, setIsOpenTooltip] = useState<boolean>(false)
	const { selected_timezone: timezone } = useGeneralSetting()
	const [clickedElement, setClickedElement] = useState<HTMLDivElement | null>(null)

	const { data: events } = useGetEvents()

	const eventsForCalendar = events || {
		gregorianEvents: [],
		hijriEvents: [],
		shamsiEvents: [],
	}

	// jalali-moment evaluates .date()/.month()/.startOf()/.endOf()/.day() against the
	// Jalali calendar whenever the moment's locale is 'fa'. getCurrentDate() returns an
	// 'fa' moment, so in Gregorian mode we must run the grid math on an 'en' clone —
	// otherwise the grid is built on the Jalali month and "today" lands on the Jalali day.
	const gregBase = currentDate.clone().locale('en')

	const monthStart = isJalali
		? currentDate.clone().doAsGregorian().startOf('jMonth')
		: gregBase.clone().startOf('month')
	const monthEnd = isJalali
		? currentDate.clone().doAsGregorian().endOf('jMonth')
		: gregBase.clone().endOf('month')

	const { data: calendarData, refetch } = useGetCalendarData(
		isAuthenticated,
		monthStart.format('YYYY-MM-DD'),
		monthEnd.format('YYYY-MM-DD')
	)

	const weekdays = isJalali
		? WEEKDAYS
		: t('widgets.calendar.weekdaysGregorian').split(',')

	const firstDayOfMonth = isJalali
		? currentDate.clone().startOf('jMonth').day()
		: gregBase.clone().startOf('month').day()
	const daysInMonth = isJalali
		? currentDate.clone().endOf('jMonth').jDate()
		: gregBase.clone().endOf('month').date()
	const emptyDays = isJalali ? (firstDayOfMonth + 1) % 7 : firstDayOfMonth

	const prevMonth = isJalali
		? currentDate.clone().subtract(1, 'jMonth')
		: gregBase.clone().subtract(1, 'month')
	const daysInPrevMonth = isJalali
		? prevMonth.clone().endOf('jMonth').jDate()
		: prevMonth.clone().endOf('month').date()
	const prevMonthStartDay = daysInPrevMonth - emptyDays + 1

	const totalCells = 42
	const nextMonthDays = totalCells - daysInMonth - emptyDays

	const selectedDateStr = formatDateStr(selectedDate)

	return (
		<>
			<div className="grid grid-cols-7 gap-1 py-2 text-center">
				{weekdays.map((day) => (
					<div key={day} className={'text-sm mb-1 text-content opacity-80'}>
						{day}
					</div>
				))}

				{Array.from({ length: emptyDays }).map((_, i) => (
					<div
						key={`prev-month-${i}`}
						className={`
						p-0 text-xs
						h-6 w-6 mx-auto flex items-center justify-center rounded-full
						text-content opacity-40
					`}
					>
						{prevMonthStartDay + i}
					</div>
				))}
				{Array.from({ length: daysInMonth }, (_, i) => (
					<DayItem
						key={`day-${i}`}
						currentDate={currentDate}
						isJalali={isJalali}
						day={i + 1}
						events={eventsForCalendar}
						googleEvents={calendarData?.googleEvents || []}
						selectedDateStr={selectedDateStr}
						setSelectedDate={setSelectedDate}
						timezone={timezone.value}
						moods={calendarData?.moods ?? []}
						onClick={(element) => {
							setClickedElement(element)
							setIsOpenTooltip(true)
						}}
					/>
				))}

				{Array.from({ length: nextMonthDays }).map((_, i) => (
					<div
						key={`next-month-${i}`}
						className={`
						p-0 text-xs 
						h-6 w-6 mx-auto flex items-center justify-center rounded-full
						text-content opacity-40
					`}
					>
						{i + 1}
					</div>
				))}
			</div>

			{clickedElement && (
				<ClickableTooltip
					triggerRef={{ current: clickedElement }}
					content={
						<CalendarDayDetails
							events={eventsForCalendar}
							moods={calendarData?.moods ?? []}
							onMoodChange={() => refetch()}
						/>
					}
					isOpen={isOpenTooltip}
					setIsOpen={setIsOpenTooltip}
				/>
			)}
		</>
	)
}
