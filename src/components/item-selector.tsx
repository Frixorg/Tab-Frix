import type React from 'react'
import { useTranslation } from 'react-i18next'
interface Props {
	isActive: boolean
	onClick: () => void
	label: string | React.ReactNode
	description?: string | React.ReactNode
	className?: string
	style?: React.CSSProperties
}
export function ItemSelector({
	isActive,
	onClick,
	label,
	description,
	className,
	style,
}: Props) {
	const { i18n } = useTranslation()
	const direction = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'
	const getRadioBorderStyle = (isSelected: boolean) => {
		if (isSelected) {
			return 'border-primary bg-primary'
		}

		return 'border-content bg-base-300/60'
	}

	return (
		<div
			onClick={onClick}
			className={`flex cursor-pointer flex-col items-start p-3 transition-all border rounded-xl ${className} ${
				isActive
					? 'border-primary/25 bg-primary/20'
					: 'bg-base-300/25 border-content hover:!border-primary/15 hover:!bg-primary/5'
			}`}
			style={style}
		>
			<div className={`flex items-center justify-center gap-0.5 ${description ? 'mb-2' : 'mb-0'}`}>
				<div
					className={`w-4 h-4 rounded-full text-white border ${getRadioBorderStyle(isActive)}`}
				>
					{isActive && (
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className={`w-full h-full p-0.5 ${direction === 'rtl' ? 'mt-[-2px]' : ''}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={3}
								d="M5 13l4 4L19 7"
							/>
						</svg>
					)}
				</div>
				<span className={`text-sm font-medium text-content ${direction === 'rtl' ? 'mr-1.5' : 'ml-1.5 mb-[-3px]'}`}>{label}</span>
			</div>
			{description && (
				<div className={`text-xs text-muted ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>{description}</div>
			)}
		</div>
	)
}
