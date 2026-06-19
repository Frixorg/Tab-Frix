import { FaGlobeAsia } from 'react-icons/fa'
import { FaMoon } from 'react-icons/fa6'
import { useState } from 'react'
import type { FetchedAllEvents } from '@/services/hooks/date/getEvents.hook'
import {
	getGregorianEvents,
	getHijriEvents,
	getShamsiEvents,
	hijriMonthNames,
} from '../../utils'
import { useDate } from '@/context/date.context'
import type React from 'react'
import {
	type MoodType,
	useUpsertMoodLog,
} from '@/services/hooks/moodLog/upsert-moodLog.hook'
import { safeAwait } from '@/services/api'
import type { AxiosError } from 'axios'
import { useIsMutating } from '@tanstack/react-query'
import { autoFormatErrorToast, showToast } from '@/common/toast'
import type { MoodEntry } from '@/services/hooks/moodLog/get-moods.hook'
import Analytics from '@/analytics'
import { moodOptions } from '@/common/constant/moods'
import { useLanguage } from '@/context/language.context'
import { TbMoodHappy } from 'react-icons/tb'

interface CalendarDayDetailsProps {
	events: FetchedAllEvents
	eventIcon?: string
	moods: MoodEntry[]
	onMoodChange?: (mood: MoodType) => void
}

export const CalendarDayDetails: React.FC<CalendarDayDetailsProps> = ({
	events,
	moods,
	onMoodChange,
}) => {
	const { selectedDate, today, getHijriDate, isJalali } = useDate()
	const { t } = useLanguage()
	const { mutateAsync: upsertMoodLog } = useUpsertMoodLog()

	const [mood, setMood] = useState<MoodType | ''>('')

	const isAdding = useIsMutating({ mutationKey: ['upsertMoodLog'] }) > 0

	const handleMoodChange = async (value: string) => {
		if (isAdding) return
		if (value === '') return

		const currentGregorian = today.clone().doAsGregorian()
		const selectedGregorian = selectedDate.clone().doAsGregorian()

		if (selectedGregorian.isAfter(currentGregorian, 'day')) {
			showToast(t('widgets.calendar.moodFuture'), 'error')
			return
		}

		if (
			selectedGregorian.isBefore(
				currentGregorian.clone().subtract(7, 'days'),
				'day'
			)
		) {
			showToast(t('widgets.calendar.moodTooOld'), 'error')
			return
		}

		const [error, response] = await safeAwait<
			AxiosError,
			{ action: 'added' | 'removed' }
		>(
			upsertMoodLog({
				mood: value as MoodType,
				date: selectedGregorian.format('YYYY-MM-DD'),
			})
		)
		if (error) {
			autoFormatErrorToast(error)
			return
		}

		onMoodChange?.(value as MoodType)
		if (response.action === 'removed') {
			setMood('')
showToast(t('widgets.calendar.moodRemoved'), 'info')
		} else {
			setMood(value as MoodType)
			showToast(t('widgets.calendar.moodSaved'), 'success', {
				alarmSound: true,
			})
		}

		Analytics.event('calendar_mood_clicked')
	}

	// Gregorian mode shows only Gregorian events; Hijri/Shamsi are Jalali-only.
	const todayShamsiEvents = isJalali ? getShamsiEvents(events, selectedDate) : []
	const todayHijriEvents = isJalali ? getHijriEvents(events, selectedDate) : []
	const todayGregorianEvents = getGregorianEvents(events, selectedDate)

	const holidayEvents = isJalali
		? [...todayShamsiEvents, ...todayHijriEvents]
		: todayGregorianEvents

	const isHoliday =
		(isJalali && selectedDate.day() === 5) ||
		holidayEvents.some((event) => event.isHoliday)

	const dayEvent = [
		...todayShamsiEvents,
		...todayGregorianEvents,
		...todayHijriEvents,
	].sort((a) => (a.isHoliday ? -1 : 1))

	const hijriRaw = getHijriDate(selectedDate)
	const [_, hijriMonth, hijriDate] = hijriRaw.split('/')
	const hijriMonthName = hijriMonthNames[Number(hijriMonth) - 1] || hijriMonth

	const gregorian = selectedDate.clone().doAsGregorian().format('DD MMM YYYY')
	const jalali = selectedDate.format('jYYYY/jMM/jD')
	const jalaliDay = selectedDate.format('dddd')
	const gregWeekday = selectedDate.clone().locale('en').format('dddd')
	const weekdayLabel = isJalali ? jalaliDay : gregWeekday
	const primaryDate = isJalali ? jalali : gregorian
	const secondaryDate = isJalali ? gregorian : jalali
	const selectedIsToday =
		selectedDate.clone().doAsGregorian().format('YYYY-MM-DD') ===
		today.clone().doAsGregorian().format('YYYY-MM-DD')

	const totalEvents = dayEvent.length
	const holidayStyle = isHoliday
		? 'from-orange-600 to-red-700'
		: 'from-sky-500 to-blue-700'

	useEffect(() => {
		const selectedDateStr = selectedDate.doAsGregorian().format('YYYY-MM-DD')
		const existingMood = moods?.find((m) => m.date === selectedDateStr)
		setMood(existingMood?.mood || '')
	}, [selectedDate, moods])

	return (
		<div className="my-1 flex flex-col w-[240px] rounded-xl overflow-hidden bg-base-100 border border-base-300">
			{/* Header */}
			<div
				className={`px-3 py-2 bg-gradient-to-r rounded-b-lg ${holidayStyle} text-white`}
			>
				<div className="flex items-center justify-between text-sm">
					<span className="font-medium">{weekdayLabel}</span>
					<span className="opacity-90">{primaryDate}</span>
				</div>
			</div>

			<div className="p-2 space-y-2">
				<div className={`flex items-center justify-between px-1 text-xs text-muted ${isJalali ? '' : 'hidden'}`}>
					<div className="flex items-center gap-1">
						<FaMoon size={10} />
						<span>
							{hijriDate} {hijriMonthName}
						</span>
					</div>
					<div className="flex items-center gap-1">
						<FaGlobeAsia size={10} />
						<span>{secondaryDate}</span>
					</div>
				</div>

				{selectedDate.isBefore() && (
					<div className="p-1.5 rounded-2xl bg-content">
						<div className="flex items-center gap-1 mb-1.5 px-0.5">
							<TbMoodHappy className="text-secondary" size={12} />
							<span className="text-[10px] font-medium text-content">
								{selectedIsToday
									? t('widgets.calendar.moodToday')
									: t('widgets.calendar.moodDay')}
							</span>
						</div>
						<div className="grid grid-cols-4 gap-1">
							{moodOptions
								.filter((f) => f.label)
								.map((option) => (
									<button
										key={option.value}
										onClick={() => handleMoodChange(option.value)}
										disabled={isAdding}
										className={`p-1.5 rounded-xl transition-all cursor-pointer ${
											mood === option.value
												? `bg-${option.colorClass} text-${option.colorClass}-content scale-105`
												: `bg-base-300 hover:bg-base-300/70 opacity-80 hover:opacity-100`
										}`}
									>
										{isAdding ? (
											<div className="w-5 h-5 mx-auto border-2 border-white rounded-full border-t-transparent animate-spin" />
										) : (
											<>
												<div className="text-lg leading-none mb-0.5">
													{option.emoji}
												</div>
												<div className="text-[10px] leading-tight">
													{option.label}
												</div>
											</>
										)}
									</button>
								))}
						</div>
					</div>
				)}

				{totalEvents > 0 && (
					<div className="flex flex-row flex-wrap pr-1 space-y-1 overflow-y-auto gap-x-1 max-h-32 scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent">
						{dayEvent.map((event, idx) => (
							<div
								key={`e-${idx}`}
								className={`flex items-center py-1! gap-1 h-5  w-fit px-2 outline rounded-lg ${
									event.isHoliday
										? 'bg-error/20 text-error outline-error/10'
										: 'badge badge-ghost text-content outline-base-200'
								}`}
							>
								<div
									className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.isHoliday ? 'bg-red-400 animate-pulse' : 'bg-info'} `}
								/>
								<div className="flex-1 min-w-0 max-w-42 text-[12px] truncate">
									{event.title}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}
