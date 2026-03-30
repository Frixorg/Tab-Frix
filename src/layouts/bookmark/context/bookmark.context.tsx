import { validate } from 'uuid'
import React, { createContext, useEffect, useState } from 'react'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import { callEvent, listenEvent } from '@/common/utils/call-event'
import type { Bookmark } from '@/layouts/bookmark/types/bookmark.types'
import { safeAwait } from '@/services/api'
import { useRemoveBookmark } from '@/services/hooks/bookmark/remove-bookmark.hook'
import { translateError } from '@/utils/translate-error'
import { useAddBookmark } from '@/services/hooks/bookmark/add-bookmark.hook'
import type { AxiosError } from 'axios'
import type { BookmarkCreateFormFields } from '../components/modal/add-bookmark.modal'
import type { BookmarkUpdateFormFields } from '../components/modal/edit-bookmark.modal'
import { useUpdateBookmark } from '@/services/hooks/bookmark/update-bookmark.hook'
import { showToast } from '@/common/toast'
import {
	type FetchedBookmark,
	useGetBookmarks,
} from '@/services/hooks/bookmark/getBookmarks.hook'

const MAX_ICON_SIZE = 1 * 1024 * 1024 // 1 MB

export interface BookmarkStoreContext {
	bookmarks: Bookmark[]
	setBookmarks: (bookmarks: Bookmark[]) => void
	getCurrentFolderItems: (parentId: string | null) => Bookmark[]
	addBookmark: (bookmark: BookmarkCreateFormFields, cb: () => void) => Promise<void>
	editBookmark: (bookmark: BookmarkUpdateFormFields, cb: () => void) => void
	deleteBookmark: (id: string, cb: () => void) => void
	currentFolderId: string | null
	setCurrentFolderId: (id: string | null) => void
}

const bookmarkContext = createContext<BookmarkStoreContext>({
	bookmarks: [],
	setBookmarks: () => {},
	getCurrentFolderItems: () => [],
	addBookmark: async () => {},
	editBookmark: () => {},
	deleteBookmark: () => {},
	currentFolderId: null,
	setCurrentFolderId: () => {},
})

export const BookmarkProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null)
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
	const { data, refetch, dataUpdatedAt } = useGetBookmarks(null, true)

	const { mutateAsync: removeBookmarkAsync } = useRemoveBookmark()
	const { mutateAsync: addBookmarkAsync } = useAddBookmark()
	const { mutateAsync: updateBookmarkAsync } = useUpdateBookmark()

	useEffect(() => {
		const loadBookmarks = async () => {
			const storedBookmarks = await getFromStorage('bookmarks')
			if (Array.isArray(storedBookmarks)) {
				setBookmarks(storedBookmarks)
			}
		}
		loadBookmarks()

		const bookEvent = listenEvent(
			'bookmarksChanged',
			async (eventData: Bookmark[]) => {
				if (eventData) {
					const current = (await getFromStorage('bookmarks')) || []

					const localBookmarks = current.filter(
						(b: Bookmark) => validate(b.id) && !b.onlineId
					)
					const filteredLocalBookmarks = localBookmarks.filter((localB) => {
						return !eventData.some(
							(b) => b.id === localB.id || b.onlineId === localB.id
						)
					})

					setBookmarks([...eventData, ...filteredLocalBookmarks])
				}
			}
		)

		return () => {
			bookEvent()
		}
	}, [])

	useEffect(() => {
		const saveBookmarks = async (data: Bookmark[]) => {
			await setToStorage('bookmarks', data)
		}

		if (bookmarks !== null) {
			saveBookmarks(bookmarks)
		}
	}, [bookmarks])

	useEffect(() => {
		if (!data || data.length === 0) return

		function mapBookmarks(fetchedBookmarks: FetchedBookmark[]) {
			const mappedFetched: Bookmark[] = fetchedBookmarks.map((bookmark) => ({
				id: bookmark.offlineId || bookmark.id,
				title: bookmark.title,
				type: bookmark.type,
				parentId: bookmark.parentId,
				isLocal: true,
				isManageable: bookmark.isManageable,
				url: bookmark.url,
				icon: bookmark.icon,
				onlineId: bookmark.id,
				sticker: bookmark.sticker ?? null,
				customTextColor: bookmark.customTextColor ?? null,
				customBackground: bookmark.customBackground ?? null,
				order: bookmark.order || 0,
			}))

			return mappedFetched
		}

		const mappedFetched = mapBookmarks(data)

		callEvent('bookmarksChanged', mappedFetched)
	}, [data, dataUpdatedAt])

	const getCurrentFolderItems = (parentId: string | null) => {
		if (!bookmarks) return []
		const parentBookmark = bookmarks.find(
			(b) => b.id === parentId || b.onlineId === parentId
		)

		let currentFolderBookmarks: Bookmark[] = []
		if (parentId) {
			currentFolderBookmarks = bookmarks.filter(
				(bookmark) =>
					(typeof bookmark.parentId === 'string' &&
						bookmark.parentId === parentId) ||
					(typeof bookmark.parentId === 'string' &&
						bookmark.parentId === parentBookmark?.onlineId)
			)
		} else {
			currentFolderBookmarks = bookmarks.filter(
				(bookmark) => bookmark.parentId === null
			)
		}

		const sortedBookmarks = [...currentFolderBookmarks].sort((a, b) => {
			return (a.order || 0) - (b.order || 0)
		})
		return sortedBookmarks
	}

	const addBookmark = async (
		inputBookmark: BookmarkCreateFormFields,
		cb: () => void
	) => {
		try {
			if (inputBookmark.icon && inputBookmark.icon.size > MAX_ICON_SIZE) {
				showToast(
					`تصویر انتخاب شده (${(inputBookmark.icon.size / (1024 * 1024)).toFixed(1)} مگابایت) بزرگتر از حداکثر مجاز است.`,
					'error'
				)
				cb()
				return
			}

			const currentFolderItems = getCurrentFolderItems(inputBookmark.parentId)
			const maxOrder = currentFolderItems.reduce(
				(max, item) => Math.max(max, item.order || 0),
				-1
			)

			let parentId = inputBookmark.parentId
			if (validate(inputBookmark.parentId)) {
				const parentBookmark = bookmarks?.find(
					(b) =>
						b.id === inputBookmark.parentId ||
						b.onlineId === inputBookmark.parentId
				)
				if (parentBookmark?.onlineId) {
					parentId = parentBookmark.onlineId
				}
			}
			const result = await addBookmarkAsync({
					order: maxOrder + 1,
					parentId: parentId,
					title: inputBookmark.title,
					customBackground: inputBookmark.customBackground,
					customTextColor: inputBookmark.customTextColor,
					sticker: inputBookmark.sticker,
					type: inputBookmark.type,
					url: inputBookmark.url,
					icon: inputBookmark.icon || null,
				})

			const newBookmark: Bookmark = {
				...result,
				id: result.id,
				title: result.title,
				type: result.type,
				parentId: result.parentId,
				isLocal: true,
				url: result.url,
				icon: result.icon || null,
				order: result.order || 0,
			}

			setBookmarks((prev) => [...(prev || []), newBookmark])
			cb()

			Analytics.event('add_bookmark')
		} catch (error) {
			console.error('Error adding bookmark:', error)
			showToast('خطا در افزودن بوکمارک', 'error')
		}
	}

	const editBookmark = async (input: BookmarkUpdateFormFields, cb: () => void) => {
		if (!input.title?.trim() || !bookmarks) return

		const foundedBookmark = bookmarks.find(
			(b) =>
				b.id === input.id ||
				(typeof b.onlineId === 'string' && b.onlineId === input.onlineId)
		)
		if (!foundedBookmark) return showToast('بوکمارک یافت نشد!', 'error')

		let bookmarkIdToEdit = input.id
		if (validate(bookmarkIdToEdit)) {
			bookmarkIdToEdit = foundedBookmark.onlineId || foundedBookmark.id
		}

		await updateBookmarkAsync({
				id: bookmarkIdToEdit,
				customBackground: input.customBackground,
				customTextColor: input.customTextColor,
				sticker: input.sticker,
				title: input.title?.trim() as string,
				icon: input.icon || null,
				url: input.url,
				isDeletedIcon: input.isDeletedIcon,
			})

		setBookmarks((prev) => 
			prev?.map((b) => (b.id === bookmarkIdToEdit || b.onlineId === bookmarkIdToEdit) 
				? ({ ...b, ...input, title: input.title?.trim(), icon: b.icon } as Bookmark) 
				: b) || null
		)

		cb()
	}

	const deleteBookmark = async (id: string, cb: () => void) => {
		if (!bookmarks) return

		const bookmarkToDelete = bookmarks.find((b) => b.id === id || b.onlineId === id)
		if (!bookmarkToDelete) return

		const idToDelete = bookmarkToDelete.id

		await removeBookmarkAsync(idToDelete)
		
		setBookmarks((prev) => 
			prev?.filter((b) => b.id !== idToDelete && b.onlineId !== idToDelete) || null
		)

		Analytics.event('delete_bookmark')
		cb()
	}

	return (
		<bookmarkContext.Provider
			value={{
				bookmarks: bookmarks || [],
				setBookmarks,
				getCurrentFolderItems,
				addBookmark,
				editBookmark,
				deleteBookmark,
				currentFolderId,
				setCurrentFolderId,
			}}
		>
			{children}
		</bookmarkContext.Provider>
	)
}

export function useBookmarkStore(): BookmarkStoreContext {
	const context = React.useContext(bookmarkContext)
	if (!context) {
		throw new Error('useBookmarkStore must be used within a BookmarkProvider')
	}
	return context
}
