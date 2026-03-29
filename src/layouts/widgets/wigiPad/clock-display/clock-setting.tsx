import { useEffect, useState } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent } from '@/common/utils/call-event'
import { CheckBoxWithDescription } from '@/components/checkbox-description.component'
import { ItemSelector } from '@/components/item-selector'
import { type ClockSettings, ClockType } from './clock-setting.interface'

export function ClockSetting() {
	const { t } = useTranslation()
	const [clockSettings, setClockSettings] = useState<ClockSettings>({
		clockType: ClockType.Digital,
		showSeconds: true,
		showTimeZone: true,
		useSelectedFont: true,
	})
	const clockOptions = useMemo(
		() => [
			{
				key: 'digital',
				label: t('settings.widgets.timeCalendar.clockType.digital.label'),
				description: t('settings.widgets.timeCalendar.clockType.digital.description'),
				value: ClockType.Digital as const,
			},
			{
				key: 'analog',
				label: t('settings.widgets.timeCalendar.clockType.analog.label'),
				description: t('settings.widgets.timeCalendar.clockType.analog.description'),
				value: ClockType.Analog as const,
			},
		],
		[t]
	)

	useEffect(() => {
		async function loadClock() {
			const stored = await getFromStorage('clock')
			if (stored) setClockSettings(stored)
		}
		loadClock()
	}, [])

	const updateClockSettings = (updater: (prev: ClockSettings) => ClockSettings) => {
		setClockSettings((prev) => {
			const newSettings = updater(prev)
			handleSave(newSettings)
			return newSettings
		})
	}

	const handleSave = async (settings: ClockSettings) => {
		callEvent('wigiPadClockSettingsChanged', settings)
		await setToStorage('clock', settings)
		Analytics.event(`wigipad_clock_settings_${settings.clockType}_save`)
	}

	const onSelectType = (type: ClockType) => {
		updateClockSettings((prev) => ({ ...prev, clockType: type }))
	}

	const onToggleSeconds = () => {
		Analytics.event(
			`wigipad_clock_settings_${!clockSettings.showSeconds ? 'enable' : 'disable'}_show_seconds`
		)
		updateClockSettings((prev) => ({ ...prev, showSeconds: !prev.showSeconds }))
	}

	const onToggleTimeZone = () => {
		Analytics.event(
			`wigipad_clock_settings_${!clockSettings.showTimeZone ? 'enable' : 'disable'}_show_time_zone`
		)
		updateClockSettings((prev) => ({ ...prev, showTimeZone: !prev.showTimeZone }))
	}

	const onToggleUseSelectedFont = () => {
		Analytics.event(
			`wigipad_clock_settings_${!clockSettings.useSelectedFont ? 'enable' : 'disable'}_use_selected_font`
		)
		updateClockSettings((prev) => ({
			...prev,
			useSelectedFont: !prev.useSelectedFont,
		}))
	}

	return (
		<div className="space-y-3">
			<div>
				<p className="mb-3 text-sm text-muted">
					{t('settings.widgets.timeCalendar.clockType.title')}
				</p>
				<div className="flex gap-2">
					{clockOptions.map((option) => (
						<ItemSelector
							key={option.key}
							isActive={clockSettings.clockType === option.value}
							onClick={() => onSelectType(option.value)}
							label={option.label}
							description={option.description}
							className="flex-1 text-center"
						/>
					))}
				</div>
			</div>

			<div className="px-1 space-y-2">
				<CheckBoxWithDescription
					isEnabled={clockSettings.showSeconds}
					onToggle={onToggleSeconds}
					title={t('settings.widgets.timeCalendar.toggles.showSeconds.title')}
					description={t(
						'settings.widgets.timeCalendar.toggles.showSeconds.description'
					)}
				/>

				<CheckBoxWithDescription
					isEnabled={clockSettings.showTimeZone}
					onToggle={onToggleTimeZone}
					title={t('settings.widgets.timeCalendar.toggles.showTimeZone.title')}
					description={t(
						'settings.widgets.timeCalendar.toggles.showTimeZone.description'
					)}
				/>

				<CheckBoxWithDescription
					isEnabled={clockSettings.useSelectedFont ?? false}
					onToggle={onToggleUseSelectedFont}
					title={t('settings.widgets.timeCalendar.toggles.useSelectedFont.title')}
					description={t(
						'settings.widgets.timeCalendar.toggles.useSelectedFont.description'
					)}
				/>
			</div>
		</div>
	)
}
