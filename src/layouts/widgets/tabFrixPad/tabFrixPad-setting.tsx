import { SectionPanel } from '@/components/section-panel'
import { WidgetSettingWrapper } from '@/layouts/widgets-settings/widget-settings-wrapper'
import { useTranslation } from 'react-i18next'
import { ClockSetting } from './clock-display/clock-setting'
import { WigiPadDateSettingsModal } from './date-display/date-setting'

export function WigiPadSetting() {
	const { t } = useTranslation()

	return (
		<WidgetSettingWrapper>
			<SectionPanel title={t('settings.widgets.timeCalendar.dateSectionTitle')} size="sm">
				<WigiPadDateSettingsModal />
			</SectionPanel>
			<SectionPanel title={t('settings.widgets.timeCalendar.clockSectionTitle')} size="sm">
				<ClockSetting />
			</SectionPanel>
		</WidgetSettingWrapper>
	)
}
