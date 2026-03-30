import { SearchLayout } from './search'
import { BookmarksList } from '../bookmark/bookmarks'
import { BookmarkProvider } from '../bookmark/context/bookmark.context'
import { useSearchAndBookmarksSettings } from '@/context/search-and-bookmarks.context'

export function SearchAndBookmarksWidget() {
	const { settings } = useSearchAndBookmarksSettings()

	const justifyClass =
		settings.searchBarPosition === 'center'
			? 'justify-center'
			: settings.searchBarPosition === 'bottom'
				? 'justify-end'
				: 'justify-start'

	return (
		<div
			className={`flex flex-col h-full ${
				settings.showBookmarksList ? 'justify-start gap-2' : justifyClass
			}`}
		>
			<SearchLayout />
			{settings.showBookmarksList && (
				<BookmarkProvider>
					<BookmarksList />
				</BookmarkProvider>
			)}
		</div>
	)
}

