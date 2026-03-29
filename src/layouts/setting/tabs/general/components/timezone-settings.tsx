import { useTranslation } from 'react-i18next'
import { SectionPanel } from '@/components/section-panel'
import { useGeneralSetting } from '@/context/general-setting.context'
import { useTimezones } from '@/services/hooks/timezone/getTimezones.hook'

export function TimezoneSettings() {
	const { t } = useTranslation()
	const { selected_timezone: timezone, setTimezone } = useGeneralSetting()
	const { data: timezones, isLoading, error } = useTimezones()
	const handleSelectTimezone = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const selectedTimezone = timezones?.find((tz) => tz.value === e.target.value)
		if (!selectedTimezone) return
		setTimezone(selectedTimezone)
	}

	return (
		<SectionPanel title={t('settings.general.timezone.title')} delay={0.1}>
			<div className="space-y-3">
				<p className="text-sm text-muted">{t('settings.general.timezone.description')}</p>

				<div className="relative">
					<div className="flex items-center gap-2">
						{isLoading ? (
							<div className="flex justify-center w-full p-3">
								<div className="w-6 h-6 border-2 border-blue-200 rounded-full border-t-blue-500 animate-spin" />
							</div>
						) : error ? (
							<div className="w-full p-3 text-center text-red-500">
								{t('settings.general.timezone.errorLoad')}
							</div>
						) : (
							<select
								value={timezone.value}
								onChange={handleSelectTimezone}
								className="w-full rounded-lg appearance-none border-content border select focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
								{!timezone && (
									<option value="">{t('settings.general.timezone.placeholder')}</option>
								)}
								{timezones?.map((tz) => (
									<option
										key={tz.value}
										value={tz.value}
										className="bg-content text-content opacity-55"
									>
										{tz.label} ({tz.offset})
									</option>
								))}
							</select>
						)}
					</div>
				</div>
			</div>
		</SectionPanel>
	)
}
