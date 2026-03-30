import { useCallback, useState, useRef } from 'react'
import { HiCog, HiViewGridAdd } from 'react-icons/hi'
import { useTranslation } from 'react-i18next'
import { callEvent } from '@/common/utils/call-event'
import { ClickableTooltip } from '@/components/clickableTooltip'
import { useAppearanceSetting } from '@/context/appearance.context'
import { AiOutlineDrag } from 'react-icons/ai'
import { showToast } from '@/common/toast'

interface SettingsProps {
	setShowSettings: (value: boolean) => void
}
export const SettingsDropdown = ({ setShowSettings }: SettingsProps) => {
	const { t, i18n } = useTranslation()
	const { canReOrderWidget, toggleCanReOrderWidget, ui } = useAppearanceSetting()
	const [isOpen, setIsOpen] = useState(false)
	const triggerRef = useRef<HTMLDivElement>(null)

	const handleWidgetSettingsClick = useCallback(() => {
		callEvent('openWidgetsSettings', { tab: null })
		callEvent('closeAllDropdowns')
		setIsOpen(false)
	}, [])

	const handleSettingsClick = useCallback(() => {
		setShowSettings(true)
		callEvent('closeAllDropdowns')
		setIsOpen(false)
	}, [])

	const onClick = () => {
		if (ui === 'SIMPLE') {
			showToast(t('settings.dropdown.simpleUiWarning'), 'error')
			return
		}
		toggleCanReOrderWidget()
		setIsOpen(false)
	}

	const content = (
		<div className="py-2 bg-content bg-glass min-w-[200px] rounded-2xl">
			<button
				onClick={(_e) => {
					handleSettingsClick()
				}}
				className={`flex ${i18n.dir() === 'rtl' ? 'flex-row' : 'flex-row-reverse'} items-center w-full gap-3 px-3 py-2 text-sm text-right transition-colors rounded-none cursor-pointer group hover:bg-primary/10 hover:text-primary`}
			>
				<HiCog size={16} className="text-muted group-hover:!text-primary" />
				<span>{t('settings.title')}</span>
			</button>

			<button
				onClick={(_e) => {
					handleWidgetSettingsClick()
				}}
				className={`flex ${i18n.dir() === 'rtl' ? 'flex-row' : 'flex-row-reverse'} items-center justify-between w-full px-3 py-2 text-sm text-right transition-colors rounded-none cursor-pointer group hover:bg-primary/10 hover:text-primary`}
			>
				<div className={`flex ${i18n.dir() === 'rtl' ? 'flex-row' : 'flex-row-reverse'} items-center gap-3`}>
					<HiViewGridAdd
						size={16}
						className="text-muted group-hover:!text-primary"
					/>
					<span>{t('settings.dropdown.manageWidgets')}</span>
				</div>
			</button>

			<div
				className="relative px-3 py-2 border-t cursor-pointer border-base-300 group hover:bg-primary/10 hover:text-primary"
				onClick={() => onClick()}
			>
				<div className={`flex ${i18n.dir() === 'rtl' ? 'flex-row' : 'flex-row-reverse'} items-center gap-3`}>
					<AiOutlineDrag
						size={16}
						className="text-muted group-hover:!text-primary"
					/>
					{canReOrderWidget ? (
						<span>{t('settings.dropdown.disableReorder')}</span>
					) : (
						<span>{t('settings.dropdown.enableReorder')}</span>
					)}
				</div>
			</div>
		</div>
	)

	return (
		<>
			<div
				ref={triggerRef}
				className="relative p-2 transition-all cursor-pointer nav-btn text-white/40 hover:text-white active:scale-90"
				id="settings-button"
			>
				<HiCog size={20} />
			</div>
			<ClickableTooltip
				triggerRef={triggerRef}
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				content={content}
				contentClassName="!p-0"
				closeOnClickOutside={true}
			/>
		</>
	)
}
