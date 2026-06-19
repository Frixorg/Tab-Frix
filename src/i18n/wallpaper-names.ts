import type { Language } from './types'

// The wallpaper catalog is served from the upstream API (Persian names), so the
// names/categories can't go through the static locale files. This is a best-effort
// dictionary for the shipped catalog; anything not listed falls back to the
// original Persian name. Keys are normalized (Arabic→Persian letters, ZWNJ→space,
// collapsed whitespace, lowercased) so spelling variants still match.

function norm(s: string): string {
	return s
		.replace(/ي/g, 'ی')
		.replace(/ك/g, 'ک')
		.replace(/‌/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.toLowerCase()
}

const MAP: Record<string, { en: string; it: string }> = {
	// Categories
	[norm('متحرک')]: { en: 'Animated', it: 'Animati' },
	[norm('ساکن')]: { en: 'Static', it: 'Statici' },
	[norm('طبیعت')]: { en: 'Nature', it: 'Natura' },
	[norm('منظره')]: { en: 'Landscape', it: 'Paesaggi' },
	[norm('بازی')]: { en: 'Games', it: 'Giochi' },
	[norm('گیمینگ')]: { en: 'Gaming', it: 'Gaming' },
	[norm('فضا')]: { en: 'Space', it: 'Spazio' },
	[norm('انیمه')]: { en: 'Anime', it: 'Anime' },
	[norm('فیلم و سریال')]: { en: 'Movies & Series', it: 'Film e Serie' },
	[norm('ماشین')]: { en: 'Cars', it: 'Auto' },
	[norm('خودرو')]: { en: 'Cars', it: 'Auto' },
	[norm('ورزشی')]: { en: 'Sports', it: 'Sport' },
	[norm('حیوانات')]: { en: 'Animals', it: 'Animali' },
	[norm('مذهبی')]: { en: 'Religious', it: 'Religiosi' },
	[norm('مینیمال')]: { en: 'Minimal', it: 'Minimal' },
	[norm('انتزاعی')]: { en: 'Abstract', it: 'Astratti' },
	[norm('شهر')]: { en: 'City', it: 'Città' },
	[norm('تکنولوژی')]: { en: 'Technology', it: 'Tecnologia' },

	// Wallpapers
	[norm('نگهبان ابدی')]: { en: 'Eternal Guardian', it: 'Guardiano Eterno' },
	[norm('سیسی شبح')]: { en: 'Ghostly Sissy', it: 'Sissy Spettrale' },
	[norm('استراحت شکارچی')]: { en: "Hunter's Rest", it: 'Riposo del Cacciatore' },
	[norm('دسته بازی RGB')]: { en: 'RGB Gamepad', it: 'Gamepad RGB' },
	[norm('RGB دسته بازی')]: { en: 'RGB Gamepad', it: 'Gamepad RGB' },
	[norm('ماه زیبا')]: { en: 'Beautiful Moon', it: 'Bella Luna' },
	[norm('ددپول')]: { en: 'Deadpool', it: 'Deadpool' },
	[norm('شوالیه')]: { en: 'Knight', it: 'Cavaliere' },
	[norm('شب بارونی')]: { en: 'Rainy Night', it: 'Notte Piovosa' },
	[norm('شب بارانی')]: { en: 'Rainy Night', it: 'Notte Piovosa' },
}

export function translateWallpaperName(
	name: string | undefined | null,
	lang: Language
): string {
	if (!name) return ''
	if (lang === 'fa') return name
	const hit = MAP[norm(name)]
	if (!hit) return name
	return lang === 'it' ? hit.it : hit.en
}
