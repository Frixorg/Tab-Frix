import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MdOutlinePrivacyTip } from 'react-icons/md'
import { TbApps } from 'react-icons/tb'
import {
	VscColorMode,
	VscInfo,
	VscMegaphone,
	VscPaintcan,
	VscRecordKeys,
	VscSettingsGear,
} from 'react-icons/vsc'
import Analytics from '@/analytics'
import { callEvent } from '@/common/utils/call-event'
import Modal from '@/components/modal'
import { TabFrixBrand } from '@/components/tabfrix-brand'
import { type TabItem, TabManager } from '@/components/tab-manager'
import { UpdateReleaseNotesModal } from '@/components/UpdateReleaseNotesModal'
import { AboutUsTab } from './tabs/about-us/about-us'
import { AppearanceSettingTab } from './tabs/appearance/appearance'
import { GeneralSettingTab } from './tabs/general/general'
import { PrivacySettings } from './tabs/privacy/privacy-settings'
import { ShortcutsTab } from './tabs/shortcuts/shortcuts'
import { WallpaperSetting } from './tabs/wallpapers/wallpapers'
import { RiApps2AiLine } from 'react-icons/ri'
import { ConnectionPlatformsTab } from './tabs/account/tabs/connection/connectionsTab'

interface SettingModalProps {
	isOpen: boolean
	onClose: () => void
	selectedTab: string | null
}

export const SettingModal = ({ isOpen, onClose, selectedTab }: SettingModalProps) => {
	const { t, i18n } = useTranslation()
	const [isUpdateModalOpen, setUpdateModalOpen] = useState(false)

	const direction = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'

	const tabs: TabItem[] = useMemo(
		() => [
			{
				parentName: t('settings.groups.account'),
				children: [
					{
						label: t('settings.tabs.platforms'),
						value: 'platforms',
						icon: <RiApps2AiLine size={20} />,
						element: <ConnectionPlatformsTab />,
					},
				],
			},
			{
				parentName: t('settings.groups.preferences'),
				children: [
					{
						label: t('settings.tabs.general'),
						value: 'general',
						icon: <VscSettingsGear size={20} />,
						element: <GeneralSettingTab />,
					},
					{
						label: t('settings.tabs.access'),
						value: 'access',
						icon: <MdOutlinePrivacyTip size={20} />,
						element: <PrivacySettings key="privacy" />,
					},
					{
						label: t('settings.tabs.appearance'),
						value: 'appearance',
						icon: <VscColorMode size={20} />,
						element: <AppearanceSettingTab />,
					},
					{
						label: t('settings.tabs.wallpapers'),
						value: 'wallpapers',
						icon: <VscPaintcan size={20} />,
						element: <WallpaperSetting />,
					},
					{
						label: t('settings.tabs.shortcuts'),
						value: 'shortcuts',
						icon: <VscRecordKeys size={20} />,
						element: <ShortcutsTab />,
					},
				],
			},
			{
				parentName: <TabFrixBrand variant="sidebar" />,
				children: [
					{
						label: t('settings.tabs.about'),
						value: 'about',
						icon: <VscInfo size={20} />,
						element: <AboutUsTab />,
					},
				],
			},
		],
		[t, i18n.language]
	)

	function openWidgetSettings() {
		onClose()
		Analytics.event('open_widgets_settings_from_settings_modal')
		callEvent('openWidgetsSettings')
	}

	useEffect(() => {
		if (isOpen) {
			Analytics.event('open_settings_modal', {
				selected_tab: selectedTab,
			})
		}
	}, [isOpen])

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size="xl"
			title={t('settings.title')}
			direction={direction}
		>
			<TabManager
				tabOwner="setting"
				tabs={tabs}
				defaultTab="general"
				selectedTab={selectedTab}
				direction={direction}
			>
				<div className="flex flex-row gap-1 sm:flex-col">
					<button
						type="button"
						className={`relative items-center  flex gap-3 px-4 py-3 rounded-full transition-all duration-200 ease-in-out justify-start cursor-pointer whitespace-nowrap active:scale-[0.98] text-muted hover:bg-base-300 w-42`}
						onClick={() => openWidgetSettings()}
					>
						<TbApps size={20} className="text-muted" />
						<span className="text-sm font-light">{t('settings.Widgets')}</span>
					</button>
					<button
						type="button"
						className={`relative  items-center flex gap-3 px-4 py-3 rounded-full transition-all duration-200 ease-in-out justify-start cursor-pointer whitespace-nowrap active:scale-[0.98] text-muted hover:bg-base-300 w-42`}
						onClick={() => setUpdateModalOpen(true)}
					>
						<VscMegaphone size={20} />
						<span className="text-sm font-light">{t('settings.recentChanges')}</span>
					</button>
				</div>
			</TabManager>

			<UpdateReleaseNotesModal
				isOpen={isUpdateModalOpen}
				onClose={() => setUpdateModalOpen(false)}
				counterValue={null}
			/>
		</Modal>
	)
}
