import {
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query'
import { getFromStorage, removeFromStorage, setToStorage } from '@/common/storage'
import type { Wallpaper } from '@/common/wallpaper.interface'
import type { Theme } from '@/context/theme.context'
import { getMainClient } from '@/services/api'

interface FetchedProfile {
	email?: string
	phone?: string
	avatar: string
	username?: string
	name: string
	verified: boolean
	connections: string[]
	gender: 'MALE' | 'FEMALE' | 'OTHER' | null
	friendshipStats: {
		accepted: number
		pending: number
	}
	wallpaper: Wallpaper | null
	theme?: Theme
	activity?: string
	isBirthDateEditable: boolean
	birthDate: string | null
	font: string
	timeZone: string
	coins: number
	city?: {
		id: string
		name: string
	}

	occupation: {
		id: string
		label: string
	}
	interests: Array<{
		id: string
		label: string
	}>
	joinedAt: string
	progressbar: {
		field: string
		isDone: boolean
	}[]
	isProfileCompleted: boolean
	hasTodayMood: boolean
}

export interface UserProfile extends FetchedProfile {
	inCache?: boolean
}

export async function fetchUserProfile(): Promise<UserProfile> {
	const client = await getMainClient()
	try {
		const response = await client.get<UserProfile>('/extension/@me')
		await setToStorage('profile', { ...response.data, inCache: true })
		return response.data
	} catch (error: any) {
		// if server error or network error, return cache data
		const isServerErrorOrNetworkError =
			error.response?.status >= 500 || error.code === 'ERR_NETWORK'
		if (isServerErrorOrNetworkError) {
			const cachedProfile = await getFromStorage('profile')
			if (cachedProfile) {
				return cachedProfile
			}
		}

		if (error.response?.status === 401) {
			await removeFromStorage('auth_token')
			await removeFromStorage('profile')
		}

		throw error
	}
}

export function useGetUserProfile(options?: Partial<UseQueryOptions<UserProfile>>) {
	return useQuery({
		queryKey: ['userProfile'],
		queryFn: fetchUserProfile,
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 1,
		refetchOnWindowFocus: false,
		...options,
	})
}

export function useGetUserMoodStatus(enabled: boolean) {
	return useQuery({
		queryKey: ['userMoodStatus'],
		queryFn: async () => {
			const client = await getMainClient()

			const response = await client.get('/users/@me/moods/status')

			return response.data.data
		},
		retry: 1,
		refetchOnWindowFocus: false,
		enabled,
	})
}

interface UpdateActivityParams {
	activity: string | undefined
}

interface UpdateActivityResponse {
	message: string
}

async function updateActivity(
	body: UpdateActivityParams
): Promise<UpdateActivityResponse> {
	const client = await getMainClient()
	const response = await client.put<UpdateActivityResponse>(
		'/extension/@me/activity',
		body
	)
	return response.data
}

export function useUpdateActivity() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: updateActivity,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['userProfile'] })
		},
	})
}

export async function sendVerificationEmail(): Promise<void> {
	const api = await getMainClient()
	const response = await api.post('/auth/email/resend-verify')
	return response.data
}

export function useSendVerificationEmail() {
	return useMutation({
		mutationFn: sendVerificationEmail,
		mutationKey: ['sendVerificationEmail'],
	})
}

export interface SelectedCityInput {
	cityId: string
	city: string
}

async function saveSelectedCity({
	cityId,
	city,
}: SelectedCityInput): Promise<{ city: SelectedCityInput; profile: UserProfile | null }> {
	// Always persist to dedicated key so it works with and without auth.
	await setToStorage('selected_city', { id: cityId, name: city })

	// Also update cached profile city if the user is logged in.
	const cachedProfile = await getFromStorage('profile')
	if (cachedProfile) {
		const updatedProfile: UserProfile = {
			...cachedProfile,
			city: { id: cityId, name: city },
			inCache: true,
		}
		await setToStorage('profile', updatedProfile)
		return { city: { cityId, city }, profile: updatedProfile }
	}

	return { city: { cityId, city }, profile: null }
}

export function useSetCity() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: (input: SelectedCityInput) => saveSelectedCity(input),
		onSuccess: ({ profile }) => {
			if (profile) {
				queryClient.setQueryData(['userProfile'], profile)
			}
		},
	})
}

export function useChangePhoneRequest() {
	return useMutation({
		mutationFn: async (phone: string) => {
			const client = await getMainClient()
			const response = await client.put<UpdateActivityResponse>(
				'/users/@me/change-phone',
				{ phone }
			)
			return response.data
		},
	})
}

export function useChangePhoneVerify() {
	return useMutation({
		mutationFn: async (body: { phone: string; code: string }) => {
			const client = await getMainClient()
			const response = await client.put<UpdateActivityResponse>(
				'/users/@me/change-phone/verify',
				body
			)
			return response.data
		},
	})
}

export function useChangeEmailRequest() {
	return useMutation({
		mutationFn: async (email: string) => {
			const client = await getMainClient()
			const response = await client.put<UpdateActivityResponse>(
				'/users/@me/change-email',
				{ email }
			)
			return response.data
		},
	})
}

export function useChangeEmailVerify() {
	return useMutation({
		mutationFn: async (body: { email: string; code: string }) => {
			const client = await getMainClient()
			const response = await client.put<UpdateActivityResponse>(
				'/users/@me/change-email/verify',
				body
			)
			return response.data
		},
	})
}
