import { useGeneralSetting } from '@/context/general-setting.context'
import { useDate } from '@/context/date.context'
import type React from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa6'
import { TfiBackRight } from 'react-icons/tfi'
import { type WidgetifyDate, getCurrentDate } from '../utils'

interface CalendarHeaderProps {
	currentDate: WidgetifyDate
	selectedDate: WidgetifyDate
	setCurrentDate: (date: WidgetifyDate) => void
	goToToday: () => void
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
	currentDate,
	selectedDate,
	setCurrentDate,
	goToToday,
}) => {
	const { selected_timezone: timezone } = useGeneralSetting()
	const { isJalali } = useDate()

	const isCurrentMonthToday = () => {
		const realToday = getCurrentDate(timezone.value)
		return isJalali
			? currentDate.jMonth() === realToday.jMonth() &&
					currentDate.jYear() === realToday.jYear()
			: currentDate.month() === realToday.month() &&
					currentDate.year() === realToday.year()
	}

	const isTodaySelected = () => {
		const realToday = getCurrentDate(timezone.value)
		return isJalali
			? selectedDate.jDate() === realToday.jDate() &&
					selectedDate.jMonth() === realToday.jMonth() &&
					selectedDate.jYear() === realToday.jYear()
			: selectedDate.date() === realToday.date() &&
					selectedDate.month() === realToday.month() &&
					selectedDate.year() === realToday.year()
	}

	const showTodayButton = !isCurrentMonthToday() || !isTodaySelected()

	const changeMonth = (delta: number) => {
		// @ts-ignore
		setCurrentDate((prev: jalaliMoment.Moment) =>
			prev.clone().add(delta, isJalali ? 'jMonth' : 'month')
		)
	}

	return (
		<div className="flex items-center justify-between">
			<h3 className={'font-medium text-xs text-content'}>
				{isJalali
					? currentDate.format('dddd، jD jMMMM jYYYY')
					: currentDate.clone().locale('en').format('dddd, D MMMM YYYY')}
			</h3>{' '}
			<div className="flex gap-0.5">
				{showTodayButton && (
					<button
						onClick={goToToday}
						className={
							'h-7 w-7 flex items-center justify-center rounded-full cursor-pointer transition-colors text-muted opacity-70 text-muted hover:bg-base-300 duration-300 hover:opacity-100 animate-in fade-in-0 zoom-in-95'
						}
					>
						<TfiBackRight size={12} strokeWidth={1} />
					</button>
				)}

				<button
					onClick={() => changeMonth(-1)}
					className={
						'h-7 w-7 flex items-center justify-center rounded-full cursor-pointer transition-colors text-muted opacity-70 hover:bg-base-300 hover:opacity-100 duration-300'
					}
				>
					<FaChevronRight size={12} strokeWidth={1} />
				</button>

				<button
					onClick={() => changeMonth(1)}
					className={
						'h-7 w-7 flex items-center justify-center rounded-full cursor-pointer transition-colors text-muted opacity-70 hover:bg-base-300 hover:opacity-100 duration-300'
					}
				>
					<FaChevronLeft size={12} strokeWidth={1} />
				</button>
			</div>
		</div>
	)
}
