import { useMutation } from '@tanstack/react-query'
import { getMainClient } from '@/services/api'

export interface UpdateExtensionSettingsInput {
	pet?: string | null
	petName?: string | null
	font?: any
	theme?: string
	timeZone?: string
	wallpaperId?: string
}

export function useUpdateExtensionSettings() {
	return useMutation<any, unknown, UpdateExtensionSettingsInput>({
		mutationFn: async (data: UpdateExtensionSettingsInput) => {
			return
		},
	})
}

export function useChangeWallpaper() {
	return useMutation<any, unknown, { wallpaperId: string | null }>({
		mutationFn: async ({ wallpaperId }) => {
			return
		},
	})
}

export function useChangeTheme() {
	return useMutation<any, unknown, { theme: string }>({
		mutationFn: async ({ theme }) => {
			return
		},
	})
}

export function useChangeBrowserTitle() {
	return useMutation<any, unknown, { browserTitleId: string }>({
		mutationFn: async ({ browserTitleId }) => {
			return
		},
	})
}


export function useChangeUI() {
	return useMutation<any, unknown, { ui: string }>({
		mutationFn: async ({ ui }) => {
			return
		},
	})
}
