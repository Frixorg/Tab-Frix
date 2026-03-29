import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent } from '@/common/utils/call-event'
import { ItemSelector } from '@/components/item-selector'
import { WigiPadDateType } from './date-setting.interface'

export function WigiPadDateSettingsModal() {
	const { t } = useTranslation()
	const [selectedType, setSelectedType] = useState<WigiPadDateType | null>()
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
			} else {
				// Default to European calendar.
				setSelectedType(WigiPadDateType.Gregorian)
			}
		}

		load()
	}, [])

	const onSelectType = async (type: WigiPadDateType) => {
		await setToStorage('wigiPadDate', { dateType: type })
		setSelectedType(type)
		callEvent('wigiPadDateSettingsChanged', { dateType: type })
		Analytics.event(`wigipad_date_settings_${selectedType}_save`)
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
		</div>
	)
}
