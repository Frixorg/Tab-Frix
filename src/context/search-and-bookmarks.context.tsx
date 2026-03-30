import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getFromStorage, setToStorage } from '@/common/storage'

export type SearchBarVerticalPosition = 'top' | 'center' | 'bottom'

export interface SearchAndBookmarksSettings {
	showBookmarksList: boolean
	showBrowserBookmark: boolean
	searchBarPosition: SearchBarVerticalPosition
}

const DEFAULT_SETTINGS: SearchAndBookmarksSettings = {
	showBookmarksList: true,
	showBrowserBookmark: true,
	searchBarPosition: 'top',
}

interface SearchAndBookmarksSettingsContextType {
	settings: SearchAndBookmarksSettings
	setShowBookmarksList: (value: boolean) => void
	setShowBrowserBookmark: (value: boolean) => void
	setSearchBarPosition: (value: SearchBarVerticalPosition) => void
}

const SearchAndBookmarksSettingsContext = createContext<
	SearchAndBookmarksSettingsContextType | undefined
>(undefined)

export function SearchAndBookmarksSettingsProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [settings, setSettings] = useState<SearchAndBookmarksSettings>(DEFAULT_SETTINGS)
	const firstLoad = useRef(true)

	useEffect(() => {
		async function load() {
			const stored = await getFromStorage('searchAndBookmarksSettings')
			if (stored) setSettings({ ...DEFAULT_SETTINGS, ...stored })
			firstLoad.current = false
		}
		void load()
	}, [])

	useEffect(() => {
		if (firstLoad.current) return
		void setToStorage('searchAndBookmarksSettings', settings)
	}, [settings])

	const value = useMemo<SearchAndBookmarksSettingsContextType>(
		() => ({
			settings,
			setShowBookmarksList: (value) =>
				setSettings((prev) => ({ ...prev, showBookmarksList: value })),
			setShowBrowserBookmark: (value) =>
				setSettings((prev) => ({ ...prev, showBrowserBookmark: value })),
			setSearchBarPosition: (value) =>
				setSettings((prev) => ({ ...prev, searchBarPosition: value })),
		}),
		[settings]
	)

	return (
		<SearchAndBookmarksSettingsContext.Provider value={value}>
			{children}
		</SearchAndBookmarksSettingsContext.Provider>
	)
}

export function useSearchAndBookmarksSettings() {
	const ctx = useContext(SearchAndBookmarksSettingsContext)
	if (!ctx) {
		throw new Error(
			'useSearchAndBookmarksSettings must be used within SearchAndBookmarksSettingsProvider'
		)
	}
	return ctx
}

