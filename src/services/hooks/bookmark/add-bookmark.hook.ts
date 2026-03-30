import { useMutation } from '@tanstack/react-query'
import { getMainClient } from '@/services/api'
import type { Bookmark, BookmarkType } from '@/layouts/bookmark/types/bookmark.types'

export interface BookmarkCreationPayload {
	title: string
	type: BookmarkType
	url: string | null
	sticker: string | null
	parentId: string | null
	order: number | null
	customTextColor: string | null
	customBackground: string | null
	icon: File | null
}

export const useAddBookmark = () => {
	return useMutation({
		mutationKey: ['addBookmark'],
		mutationFn: async (input: BookmarkCreationPayload) => {
			return await AddBookmarkApi(input)
		},
	})
}

export async function AddBookmarkApi(input: BookmarkCreationPayload) {
	return {
		id: Math.random().toString(36).substring(7),
		title: input.title,
		type: input.type,
		url: input.url,
		sticker: input.sticker,
		parentId: input.parentId,
		order: input.order || 0,
		customTextColor: input.customTextColor,
		customBackground: input.customBackground,
		isLocal: true,
	} as Bookmark
}
