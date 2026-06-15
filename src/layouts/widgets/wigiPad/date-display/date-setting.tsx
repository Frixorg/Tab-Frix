import { useState } from 'react'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent } from '@/common/utils/call-event'
import { ItemSelector } from '@/components/item-selector'
import { WigiPadDateType } from './date-setting.interface'
import { useLanguage } from '@/context/language.context'

export function WigiPadDateSettingsModal() {
	const { t, lang } = useLanguage()
	const DateOptions = [
		{
			key: 'jalali',
			label: t('widgets.wigiPad.jalaliLabel'),
			description: t('widgets.wigiPad.jalaliDesc'),
			value: WigiPadDateType.Jalali as const,
		},
		{
			key: 'gregorian',
			label: t('widgets.wigiPad.gregorianLabel'),
			description: t('widgets.wigiPad.gregorianDesc'),
			value: WigiPadDateType.Gregorian as const,
		},
	]
	const [selectedType, setSelectedType] = useState<WigiPadDateType | null>()

	useEffect(() => {
		async function load() {
			const wigiPadDateFromStore = await getFromStorage('wigiPadDate')
			if (wigiPadDateFromStore) {
				setSelectedType(wigiPadDateFromStore.dateType)
			} else {
				setSelectedType(
					lang === 'fa'
						? WigiPadDateType.Jalali
						: WigiPadDateType.Gregorian
				)
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
				<p className="mb-3 text-sm text-muted">{t('widgets.wigiPad.datePrompt')}</p>

				<div className="flex gap-2">
					{DateOptions.map((option) => (
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
