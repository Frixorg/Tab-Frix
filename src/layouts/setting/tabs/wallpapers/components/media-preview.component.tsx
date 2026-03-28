import { useTranslation } from 'react-i18next'
import type { Wallpaper } from '@/common/wallpaper.interface'

interface MediaPreviewProps {
	customWallpaper: Wallpaper
}

export function MediaPreview({ customWallpaper }: MediaPreviewProps) {
	const { t } = useTranslation()
	const alt = t('settings.wallpapers.customImagePreviewAlt')

	if (customWallpaper.type === 'IMAGE') {
		return (
			<img
				src={customWallpaper.src}
				alt={alt}
				className="object-cover w-full h-full"
			/>
		)
	}

	return (
		<video
			src={customWallpaper.src}
			className="object-cover w-full h-full"
			autoPlay
			muted
			loop
		/>
	)
}
