import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Category } from '@/common/wallpaper.interface'
import { Pagination } from '@/components/pagination'
import { wallpaperCategoryLabel } from '@/i18n/wallpaper-labels'
import {
	GALLERY_CATEGORIES,
	paginateWallpapers,
} from '../../data/gallery-wallpapers.const'
import { CategoryFolder } from './category-folder.component'

interface CategoryGridProps {
	onCategorySelect: (category: Category) => void
}
const CATEGORIES_PER_PAGE = 9

export function CategoryView({ onCategorySelect }: CategoryGridProps) {
	const { t } = useTranslation()
	const [currentPage, setCurrentPage] = useState(1)

	const { slice: categories, totalPages } = paginateWallpapers(
		GALLERY_CATEGORIES,
		currentPage,
		CATEGORIES_PER_PAGE
	)

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

	return (
		<div>
			<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
				{categories.map((category) => (
					<CategoryFolder
						key={category.id}
						id={category.id}
						name={wallpaperCategoryLabel(category.slug, t)}
						previewImages={category.wallpapers || []}
						onSelect={() => onCategorySelect(category)}
					/>
				))}
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
