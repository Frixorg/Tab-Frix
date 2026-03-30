import { useRef, useState, useEffect } from 'react'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent } from '@/common/utils/call-event'
import { SelectCity } from '@/layouts/setting/tabs/general/components/select-city'
import { WidgetSettingWrapper } from '@/layouts/widgets-settings/widget-settings-wrapper'
import { useTranslation } from 'react-i18next'
import { ToggleSwitch } from '@/components/toggle-switch.component'
import type { WeatherSettings } from './weather.interface'

export function WeatherSetting() {
	const [setting, setSetting] = useState<WeatherSettings>({
		useAI: true,
		forecastCount: 4,
		temperatureUnit: 'metric',
		enableShowName: true,
		showWindHumidity: true,
		showForecast: true,
	})
	const { t } = useTranslation()
	const isInitialLoad = useRef(true)

	useEffect(() => {
		async function load() {
			const settingFromStorage = await getFromStorage('weatherSettings')
			if (settingFromStorage) {
				setSetting({ ...settingFromStorage })
			}

			isInitialLoad.current = false
		}
		load()
	}, [])

	useEffect(() => {
		if (isInitialLoad.current) return
		callEvent('weatherSettingsChanged', setting)
		setToStorage('weatherSettings', setting)
	}, [setting])

	return (
		<WidgetSettingWrapper>
			<SelectCity key={'selectCity'} />

			<div className="flex flex-col gap-4 mt-6">
				<div className="flex items-center justify-between px-4 py-3 bg-base-200/50 rounded-2xl">
					<span className="text-sm font-medium text-base-content/80">
						{t('settings.widgets.weather.showWindHumidity')}
					</span>
					<ToggleSwitch
						enabled={!!setting.showWindHumidity}
						onToggle={() =>
							setSetting((prev) => ({
								...prev,
								showWindHumidity: !prev.showWindHumidity,
							}))
						}
					/>
				</div>

				<div className="flex items-center justify-between px-4 py-3 bg-base-200/50 rounded-2xl">
					<span className="text-sm font-medium text-base-content/80">
						{t('settings.widgets.weather.showForecast')}
					</span>
					<ToggleSwitch
						enabled={!!setting.showForecast}
						onToggle={() =>
							setSetting((prev) => ({
								...prev,
								showForecast: !prev.showForecast,
							}))
						}
					/>
				</div>
			</div>
		</WidgetSettingWrapper>
	)
}
