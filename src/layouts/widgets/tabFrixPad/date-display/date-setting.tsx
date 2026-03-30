import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent } from '@/common/utils/call-event'
import { ItemSelector } from '@/components/item-selector'
import { ToggleSwitch } from '@/components/toggle-switch.component'
import { WigiPadDateType } from './date-setting.interface'

export function WigiPadDateSettingsModal() {
	const { t } = useTranslation()
	const [selectedType, setSelectedType] = useState<WigiPadDateType | null>()
	const [showWeather, setShowWeather] = useState<boolean>(false)
	const dateOptions = useMemo(
		() => [
			{
				key: 'gregorian',
				label: t('settings.widgets.timeCalendar.calendarType.gregorian.label'),
				description: t(
					'settings.widgets.timeCalendar.calendarType.gregorian.description'
				),
				value: WigiPadDateType.Gregorian as const,
			},
			{
				key: 'jalali',
				label: t('settings.widgets.timeCalendar.calendarType.jalali.label'),
				description: t('settings.widgets.timeCalendar.calendarType.jalali.description'),
				value: WigiPadDateType.Jalali as const,
			},
		],
		[t]
	)

	useEffect(() => {
		async function load() {
			const wigiPadDateFromStore = await getFromStorage('wigiPadDate')
			if (wigiPadDateFromStore) {
				setSelectedType(wigiPadDateFromStore.dateType)
				setShowWeather(!!wigiPadDateFromStore.showWeather)
			} else {
				// Default to European calendar.
				setSelectedType(WigiPadDateType.Gregorian)
				setShowWeather(false)
			}
		}

		load()
	}, [])

	const onSelectType = async (type: WigiPadDateType) => {
		await setToStorage('wigiPadDate', { dateType: type, showWeather })
		setSelectedType(type)
		callEvent('wigiPadDateSettingsChanged', { dateType: type, showWeather })
		Analytics.event(`wigipad_date_settings_${selectedType}_save`)
	}

	const onToggleWeather = async () => {
		const newValue = !showWeather
		await setToStorage('wigiPadDate', { dateType: selectedType || WigiPadDateType.Gregorian, showWeather: newValue })
		setShowWeather(newValue)
		callEvent('wigiPadDateSettingsChanged', { dateType: selectedType || WigiPadDateType.Gregorian, showWeather: newValue })
		Analytics.event(`wigipad_show_weather_${newValue}`)
	}

	return (
		<div className="space-y-3">
			<div>
				<p className="mb-3 text-sm text-muted">
					{t('settings.widgets.timeCalendar.calendarType.title')}
				</p>

				<div className="flex gap-2">
					{dateOptions.map((option) => (
						<ItemSelector
							key={option.key}
							isActive={selectedType === option.value}
							onClick={() => onSelectType(option.value)}
							label={option.label}
							description={option.description}
							className="flex-1 text-center"
						/>
					))}
				</div>
			</div>

			<div className="flex items-center justify-between px-4 py-3 bg-base-200/50 rounded-2xl">
				<span className="text-sm font-medium text-base-content/80">
					{t('settings.widgets.timeCalendar.showWeather')}
				</span>
				<ToggleSwitch
					enabled={showWeather}
					onToggle={onToggleWeather}
				/>
			</div>
		</div>
	)
}
