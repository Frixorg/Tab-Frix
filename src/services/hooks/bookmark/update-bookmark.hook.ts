import { useMutation } from '@tanstack/react-query'
import { getMainClient } from '@/services/api'
import type { Bookmark } from '@/layouts/bookmark/types/bookmark.types'

export interface BookmarkUpdatePayload {
	id: string
	title: string
	url: string | null
	sticker: string | null
	customTextColor: string | null
	customBackground: string | null
	icon: File | null
	isDeletedIcon: boolean
}

export const useUpdateBookmark = () => {
	return useMutation({
		mutationKey: ['updateBookmark'],
		mutationFn: async (input: BookmarkUpdatePayload): Promise<Bookmark> => {
			return {
				id: input.id,
				title: input.title,
				url: input.url,
				sticker: input.sticker || null,
				customTextColor: input.customTextColor || null,
				customBackground: input.customBackground || null,
			} as Bookmark
		},
	})
}
