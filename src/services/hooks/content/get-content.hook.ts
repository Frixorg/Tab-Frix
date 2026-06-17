import { getMainClient } from '@/services/api'
import { useLanguage } from '@/context/language.context'
import { useQuery } from '@tanstack/react-query'

export interface ExplorerCategoryBadge {
	label?: string
	iconSrc?: string
	bgColor?: string
	textColor?: string
	url?: string
}
export interface FetchedContent {
	id: string
	category: string
	hideName?: boolean
	icon?: string
	banner?: string
	links: {
		name: string
		url: string
		type: 'SITE' | 'REMOTE_IFRAME' | 'BANNER' | 'MINI_APP'
		icon?: string
		span?: {
			col?: number | null
			row?: number | null
		}
		height?: number
		hasBorder: boolean
		isNew: boolean
		badge?: string
		badgeColor?: string
		backgroundSrc?: string
		badgeAnimate?: 'bounce' | 'pulse'
		miniAppAuthRequired?: boolean
	}[]
	badges: ExplorerCategoryBadge[]
	span?: {
		col?: number | null
		row?: number | null
	}
}
;[]
export interface FetchedContentsResponse {
	contents: FetchedContent[]
}

export const useGetContents = () => {
	const { lang } = useLanguage()
	return useQuery<FetchedContentsResponse>({
		queryKey: ['contents', lang],
		queryFn: async () => {
			const api = await getMainClient()

			const { data } = await api.get<FetchedContentsResponse>('/contents', {
				params: { lang },
			})
			return data
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	})
}
