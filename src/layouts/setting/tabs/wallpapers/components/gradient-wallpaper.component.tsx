import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GradientColors, Wallpaper } from '@/common/wallpaper.interface'
import { SectionPanel } from '@/components/section-panel'

interface GradientWallpaperProps {
	onSelectGradient: (gradient: Wallpaper) => void
	selectedGradient?: Wallpaper
}

type GradientPreset = {
	from: string
	to: string
	nameKey:
		| 'softPink'
		| 'skyBlue'
		| 'springGreen'
		| 'autumnOrange'
		| 'turquoise'
		| 'lightGray'
		| 'blueToPink'
		| 'softPurple'
}

const PREDEFINED_GRADIENTS: GradientPreset[] = [
	{ from: '#ff9a9e', to: '#fad0c4', nameKey: 'softPink' },
	{ from: '#a1c4fd', to: '#c2e9fb', nameKey: 'skyBlue' },
	{ from: '#d4fc79', to: '#96e6a1', nameKey: 'springGreen' },
	{ from: '#ffecd2', to: '#fcb69f', nameKey: 'autumnOrange' },
	{ from: '#84fab0', to: '#8fd3f4', nameKey: 'turquoise' },
	{ from: '#cfd9df', to: '#e2ebf0', nameKey: 'lightGray' },
	{ from: '#a6c0fe', to: '#f68084', nameKey: 'blueToPink' },
	{ from: '#fbc2eb', to: '#a6c1ee', nameKey: 'softPurple' },
]

export function GradientWallpaper({
	onSelectGradient,
	selectedGradient,
}: GradientWallpaperProps) {
	const { t } = useTranslation()
	const [direction, setDirection] = useState<GradientColors['direction']>('to-r')

	const predefinedGradients = useMemo(
		() =>
			PREDEFINED_GRADIENTS.map((g) => ({
				...g,
				name: t(`settings.wallpapers.gradients.${g.nameKey}`),
			})),
		[t]
	)

	useEffect(() => {
		if (
			selectedGradient?.type === 'GRADIENT' &&
			selectedGradient.gradient?.direction
		) {
			setDirection(selectedGradient.gradient.direction)
		}
	}, [selectedGradient])

	const getTailwindDirectionToCss = (direction: string): string => {
		const directionMap: Record<string, string> = {
			'to-r': 'to right',
			'to-l': 'to left',
			'to-t': 'to top',
			'to-b': 'to bottom',
			'to-tr': 'to top right',
			'to-tl': 'to top left',
			'to-br': 'to bottom right',
			'to-bl': 'to bottom left',
		}
		return directionMap[direction] || 'to right'
	}

	const createGradientId = (from: string, to: string): string => {
		return `gradient-${from.replace('#', '')}-${to.replace('#', '')}`
	}

	const createGradientWallpaper = (
		from: string,
		to: string,
		name: string
	): Wallpaper => {
		return {
			id: createGradientId(from, to),
			name: name,
			type: 'GRADIENT',
			src: '',
			previewSrc: '',
			gradient: {
				from,
				to,
				direction,
			},
		}
	}

	const handlePredefinedGradientSelect = (from: string, to: string, name: string) => {
		const gradient = createGradientWallpaper(from, to, name)
		onSelectGradient(gradient)
	}

	const isSelected = (from: string, to: string) => {
		if (!selectedGradient) return false

		const gradientId = createGradientId(from, to)
		return selectedGradient.id === gradientId
	}

	return (
		<div className="space-y-4">
			<SectionPanel title={t('settings.wallpapers.gradientPresetsTitle')}>
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{predefinedGradients.map((gradient, index) => (
						<div
							key={index}
							className={`rounded-lg h-24 cursor-pointer overflow-hidden relative
              ${isSelected(gradient.from, gradient.to) ? 'ring-2 ring-blue-500' : ''}
            `}
							onClick={() =>
								handlePredefinedGradientSelect(
									gradient.from,
									gradient.to,
									gradient.name
								)
							}
						>
							<div
								className={'absolute inset-0'}
								style={{
									backgroundImage: `linear-gradient(${getTailwindDirectionToCss(direction)}, ${gradient.from}, ${gradient.to})`,
								}}
							></div>
							<div className="absolute bottom-0 left-0 right-0 p-1 text-xs text-center text-white bg-black/30">
								{gradient.name}
							</div>
						</div>
					))}
				</div>
			</SectionPanel>
		</div>
	)
}
