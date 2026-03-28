import type { TFunction } from 'i18next'
import type { Wallpaper } from '@/common/wallpaper.interface'

export function wallpaperLabel(w: Wallpaper, t: TFunction): string {
	return t(`settings.wallpapers.names.${w.id}`, { defaultValue: w.name })
}

export function wallpaperCategoryLabel(slug: string, t: TFunction): string {
	return t(`settings.wallpapers.categories.${slug}`, { defaultValue: slug })
}
