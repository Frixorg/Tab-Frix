import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Category } from '@/common/wallpaper.interface'
import { SectionPanel } from '@/components/section-panel'
import { UploadArea } from '../../components/upload-area.component'
import { useWallpaper } from '../../hooks/use-wallpaper'
import { ALL_GALLERY_WALLPAPERS } from './data/gallery-wallpapers.const'
import { CategoryView } from './components/category/category-view'
import { WallpaperView } from './components/wallpaper-item/wallpaper-view'

export function GalleryTab() {
	const { t } = useTranslation()
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
	function goBackToCategories() {
		setSelectedCategory(null)
	}
	const { customWallpaper, handleCustomWallpaperChange } = useWallpaper(
		ALL_GALLERY_WALLPAPERS
	)

	return (
		<>
			<SectionPanel title={t('settings.wallpapers.gallerySectionTitle')} size="xs">
				<div className="py-4">
					{!selectedCategory ? (
						<CategoryView onCategorySelect={setSelectedCategory} />
					) : (
						<WallpaperView
							selectedCategory={selectedCategory}
							onBackToCategories={goBackToCategories}
						/>
					)}
				</div>
			</SectionPanel>

			<SectionPanel title={t('settings.wallpapers.customImageTitle')} size="xs">
				<div className="py-4">
					<UploadArea
						customWallpaper={customWallpaper}
						onWallpaperChange={handleCustomWallpaperChange}
					/>
				</div>
			</SectionPanel>
		</>
	)
}
