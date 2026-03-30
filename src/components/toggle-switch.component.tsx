import { useTranslation } from 'react-i18next'

interface ToggleSwitchProps {
	enabled: boolean
	disabled?: boolean
	onToggle: () => void
}

export const ToggleSwitch = ({
	enabled,
	disabled = false,
	onToggle,
}: ToggleSwitchProps) => {
	const { i18n } = useTranslation()
	const isRTL = i18n.language === 'fa'

	const getTrackStyle = () => {
		if (enabled) {
			return 'bg-primary'
		}

		return 'bg-base-300'
	}

	const getTranslateClass = () => {
		if (isRTL) {
			return enabled ? 'translate-x-0' : 'translate-x-4'
		}
		return enabled ? 'translate-x-4' : 'translate-x-0'
	}

	return (
		<div
			className={`
				w-10 h-6 relative rounded-full transition-colors duration-200
				${getTrackStyle()} cursor-pointer
				${disabled ? 'cursor-not-allowed opacity-70' : ''}
				${!disabled ? 'active:scale-95' : ''}`}
			onClick={disabled ? undefined : onToggle}
		>
			<span
				className={`absolute w-4 h-4 bg-white rounded-full shadow-sm top-1 left-1 transition-transform duration-300 ease-out ${getTranslateClass()}`}
			/>
		</div>
	)
}
