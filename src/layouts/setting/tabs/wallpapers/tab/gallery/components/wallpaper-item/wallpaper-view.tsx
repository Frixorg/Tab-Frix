import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { preloadImages } from '@/common/utils/preloadImages'
import type { Category } from '@/common/wallpaper.interface'
import { Pagination } from '@/components/pagination'
import { FolderPath } from '@/layouts/bookmark/components/folder-path'
import { wallpaperCategoryLabel } from '@/i18n/wallpaper-labels'
import {
	getWallpapersForGalleryCategory,
	paginateWallpapers,
} from '../../data/gallery-wallpapers.const'
import { WallpaperGallery } from '../../../../components/wallpaper-gallery.component'
import { useWallpaper } from '../../../../hooks/use-wallpaper'

interface WallpaperViewProps {
	selectedCategory: Category | null
	onBackToCategories: () => void
}
const WALLPAPERS_PER_PAGE = 9

export function WallpaperView({
	selectedCategory,
	onBackToCategories,
}: WallpaperViewProps) {
	const { t } = useTranslation()
	const [currentPage, setCurrentPage] = useState(1)

	const categoryWallpapers = useMemo(
		() =>
			selectedCategory
				? getWallpapersForGalleryCategory(selectedCategory.id)
				: [],
		[selectedCategory]
	)

	const { slice: pageWallpapers, totalPages } = useMemo(
		() =>
			paginateWallpapers(categoryWallpapers, currentPage, WALLPAPERS_PER_PAGE),
		[categoryWallpapers, currentPage]
	)

	const { selectedBackground, handleSelectBackground, handlePreviewBackground } =
		useWallpaper(categoryWallpapers)

	useEffect(() => {
		setCurrentPage(1)
	}, [selectedCategory?.id])

	const goToNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1)
		}
	}

	const goToPrevPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1)
		}
	}

	useEffect(() => {
		if (!pageWallpapers.length) return
		const imageUrls = pageWallpapers
			.filter((wp) => wp.type === 'IMAGE')
			.slice(0, 5)
			.map((wp) => wp.src)
		preloadImages(imageUrls)
	}, [pageWallpapers])

	if (!selectedCategory) return null

	const folderTitle = wallpaperCategoryLabel(selectedCategory.slug, t)

	return (
		<div className="relative flex flex-col justify-between gap-2 overflow-y-auto h-96">
			<div className="absolute start-0 flex justify-center p-1 mt-1 -top-3 bg-content rounded-t-2xl">
				<FolderPath
					folderPath={[
						{
							id: 'subfolder',
							title: folderTitle,
						},
					]}
					onNavigate={() => onBackToCategories()}
				/>
			</div>
			<div className="mt-5">
				<WallpaperGallery
					isLoading={false}
					error={null}
					wallpapers={pageWallpapers}
					selectedBackground={selectedBackground}
					onSelectBackground={handleSelectBackground}
					onPreviewBackground={handlePreviewBackground}
				/>
			</div>

			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onNextPage={goToNextPage}
				onPrevPage={goToPrevPage}
				isLoading={false}
			/>
		</div>
	)
}
