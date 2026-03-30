import { useMutation } from '@tanstack/react-query'
import { getMainClient } from '@/services/api'

export const useRemoveBookmark = () => {
	return useMutation({
		mutationKey: ['removeBookmark'],
		mutationFn: async (bookmarkId: string) => {
			return
		},
	})
}
