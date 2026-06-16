import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import {
	convertShamsiToHijri,
	getCurrentDate,
	type WidgetifyDate,
} from '@/layouts/widgets/calendar/utils'
import { useGeneralSetting } from './general-setting.context'
import { useLanguage } from './language.context'
import { getFromStorage } from '@/common/storage'
import { listenEvent } from '@/common/utils/call-event'
import { WigiPadDateType } from '@/layouts/widgets/wigiPad/date-display/date-setting.interface'

interface DateContextType {
	currentDate: WidgetifyDate
	selectedDate: WidgetifyDate
	today: WidgetifyDate
	todayIsHoliday: boolean
	setCurrentDate: (date: WidgetifyDate) => void
	setSelectedDate: (date: WidgetifyDate) => void
	goToToday: () => void
	isToday: (date: WidgetifyDate) => boolean
	getHijriDate: (date: WidgetifyDate) => string
	isJalali: boolean
}

const DateContext = createContext<DateContextType | undefined>(undefined)

export const DateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { selected_timezone: timezone } = useGeneralSetting()
	const { lang } = useLanguage()
	const activeDate = getCurrentDate(timezone.value)

	const [currentDate, setCurrentDate] = useState<WidgetifyDate>(activeDate)
	const [selectedDate, setSelectedDate] = useState<WidgetifyDate>(activeDate)
	const [today, setToday] = useState<WidgetifyDate>(activeDate)
	// The calendar date system follows the WigiPad date-type setting (Jalali/Gregorian),
	// defaulting to the app language. This keeps the month grid in sync with the date card.
	const [isJalali, setIsJalali] = useState<boolean>(lang === 'fa')

	useEffect(() => {
		async function loadDateType() {
			const stored = await getFromStorage('wigiPadDate')
			setIsJalali(
				stored?.dateType
					? stored.dateType === WigiPadDateType.Jalali
					: lang === 'fa'
			)
		}
		loadDateType()
		const off = listenEvent('wigiPadDateSettingsChanged', (data: any) => {
			setIsJalali(data?.dateType === WigiPadDateType.Jalali)
		})
		return () => off()
	}, [lang])

	// Update today date every minute to ensure it stays current
	useEffect(() => {
		const interval = setInterval(() => {
			setToday(getCurrentDate(timezone.value))
		}, 60000)

		return () => clearInterval(interval)
	}, [timezone])

	useEffect(() => {
		const newToday = getCurrentDate(timezone.value)
		setToday(newToday)
		setCurrentDate(newToday.clone())
		setSelectedDate(newToday.clone())
	}, [timezone])

	const goToToday = () => {
		const newToday = getCurrentDate(timezone.value)
		setCurrentDate(newToday.clone())
		setSelectedDate(newToday.clone())
	}

	const isToday = (date: WidgetifyDate): boolean => {
		return isJalali
			? date.jDate() === today.jDate() &&
					date.jMonth() === today.jMonth() &&
					date.jYear() === today.jYear()
			: date.date() === today.date() &&
					date.month() === today.month() &&
					date.year() === today.year()
	}

	const getHijriDate = (date: WidgetifyDate): string => {
		const hijriDate = convertShamsiToHijri(date)
		return `${hijriDate.iYear()}/${hijriDate.iMonth() + 1}/${hijriDate.iDate()}`
	}

	const todayIsHoliday = activeDate.day() === 5

	return (
		<DateContext.Provider
			value={{
				currentDate,
				selectedDate,
				todayIsHoliday,
				today,
				setCurrentDate,
				setSelectedDate,
				goToToday,
				isToday,
				getHijriDate,
				isJalali,
			}}
		>
			{children}
		</DateContext.Provider>
	)
}

export const useDate = (): DateContextType => {
	const context = useContext(DateContext)

	if (!context) {
		throw new Error('useDate must be used within a DateProvider')
	}

	return context
}
