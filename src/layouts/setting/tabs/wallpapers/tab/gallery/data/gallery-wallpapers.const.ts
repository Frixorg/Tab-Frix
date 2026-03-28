import type { Category, StoredWallpaper, Wallpaper } from '@/common/wallpaper.interface'
import gargantua from '@/assets/wallpapers/space/gargantua-black.jpg'
import sagittariusA from '@/assets/wallpapers/space/sagittarius-a-black.jpg'

import bmwM3AngelEyes from '@/assets/wallpapers/Cars/bmw-m3-angel-eyes-black.jpg'
import novitecFerrari from '@/assets/wallpapers/Cars/novitec-ferrari.jpeg'

const STAMP = '2024-01-01T00:00:00.000Z'

function imageWallpaper(
	id: string,
	name: string,
	src: string,
	categoryId: string
): Wallpaper {
	return {
		id,
		name,
		type: 'IMAGE',
		src,
		previewSrc: src,
		categoryId,
	}
}

/** Bundled gallery image ids use this prefix; `useWallpaper` skips `PUT /wallpapers/@me` for them. */
export const BUNDLED_GALLERY_WALLPAPER_ID_PREFIX = 'gallery-wp-'

export function isBundledGalleryWallpaper(w: Pick<Wallpaper, 'id'>): boolean {
	return w.id.startsWith(BUNDLED_GALLERY_WALLPAPER_ID_PREFIX)
}

/** Bundled gallery categories and wallpapers (no network). */
export const GALLERY_CATEGORIES: Category[] = [
	{
		id: 'gallery-cat-cars',
		name: 'ماشین',
		slug: 'cars',
		createdAt: STAMP,
		updatedAt: STAMP,
		wallpapers: [
			imageWallpaper(
				'gallery-wp-bmw-m3-angel-eyes',
				'BMW M3 Angel Eyes',
				bmwM3AngelEyes,
				'gallery-cat-cars'
			),
			imageWallpaper(
				'gallery-wp-novitec-ferrari',
				'Novitec Ferrari',
				novitecFerrari,
				'gallery-cat-cars'
			),
		],
	},
	{
		id: 'gallery-cat-space',
		name: 'فضایی',
		slug: 'space',
		createdAt: STAMP,
		updatedAt: STAMP,
		wallpapers: [
			imageWallpaper(
				'gallery-wp-gargantua',
				'گارانتوا',
				gargantua,
				'gallery-cat-space'
			),
			imageWallpaper(
				'gallery-wp-sagittarius-a',
				'Sagittarius A',
				sagittariusA,
				'gallery-cat-space'
			),
		],
	},
	{
		id: 'gallery-cat-nature',
		name: 'طبیعت',
		slug: 'nature',
		createdAt: STAMP,
		updatedAt: STAMP,
		wallpapers: [
		],
	},
	{
		id: 'gallery-cat-minimal',
		name: 'مینیمال',
		slug: 'minimal',
		createdAt: STAMP,
		updatedAt: STAMP,
		wallpapers: [
		],
	},
	{
		id: 'gallery-cat-night',
		name: 'شب',
		slug: 'night',
		createdAt: STAMP,
		updatedAt: STAMP,
		wallpapers: [
		],
	},
]

export const ALL_GALLERY_WALLPAPERS: Wallpaper[] = GALLERY_CATEGORIES.flatMap(
	(c) => c.wallpapers ?? []
)

/** Picks a random bundled **image** (not gradient) for first-launch default background. */
export function getRandomBundledImageWallpaper(): StoredWallpaper | null {
	const images = ALL_GALLERY_WALLPAPERS.filter(
		(w) => w.type === 'IMAGE' && Boolean(w.src)
	)
	if (images.length === 0) return null
	const pick = images[Math.floor(Math.random() * images.length)]
	return {
		id: pick.id,
		type: 'IMAGE',
		src: pick.src,
	}
}

export function getWallpapersForGalleryCategory(
	categoryId: string
): Wallpaper[] {
	return (
		GALLERY_CATEGORIES.find((c) => c.id === categoryId)?.wallpapers ?? []
	)
}

export function paginateWallpapers<T>(
	items: T[],
	page: number,
	pageSize: number
): { slice: T[]; totalPages: number } {
	const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
	const safePage = Math.min(Math.max(1, page), totalPages)
	const start = (safePage - 1) * pageSize
	return {
		slice: items.slice(start, start + pageSize),
		totalPages,
	}
}
