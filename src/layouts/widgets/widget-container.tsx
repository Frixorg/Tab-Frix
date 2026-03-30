interface WidgetContainerProps {
	children: React.ReactNode
	className?: string
	background?: boolean
	style?: any
	isCustomHeight?: boolean
}
export function WidgetContainer({
	children,
	className,
	background = true,
	style,
	isCustomHeight = false,
}: WidgetContainerProps) {
	return (
		<div
			className={`flex flex-col ${!isCustomHeight && 'h-80 min-h-80 max-h-80'} p-2 ${background && 'bg-content bg-glass'} rounded-2xl ${className}`}
			style={style}
		>
			{children}
		</div>
	)
}
