import { useEffect, useMemo, useState } from 'react'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import Analytics from '@/analytics'
import { showToast } from '@/common/toast'
import { getMainClient } from '@/services/api'
import { useGetUserProfile } from '@/services/hooks/user/userService.hook'
import { ConnectionModal } from './components/connection-modal'
import type { Platform } from './components/platform-config'
import { PLATFORM_STATIC_CONFIGS } from './components/platform-data'

function asStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) return []
	return value.filter((x): x is string => typeof x === 'string')
}

function buildPlatforms(t: TFunction): Omit<Platform, 'connected' | 'isLoading'>[] {
	return PLATFORM_STATIC_CONFIGS.map((config) => {
		const prefix = `settings.platforms.providers.${config.localeKey}` as const
		const featuresRaw = t(`${prefix}.features`, { returnObjects: true })
		const permissionsRaw = t(`${prefix}.permissions`, { returnObjects: true })
		return {
			id: config.id,
			name: t(`${prefix}.name`),
			description: t(`${prefix}.description`),
			bgColor: config.bgColor,
			isActive: config.isActive,
			icon: config.icon,
			features: asStringArray(featuresRaw),
			permissions: asStringArray(permissionsRaw),
			isOptionalPermissions: config.isOptionalPermissions,
		}
	})
}

export function Connections() {
	const { t, i18n } = useTranslation()
	const { data: profile } = useGetUserProfile()

	const basePlatforms = useMemo(
		() => buildPlatforms(t),
		[t, i18n.language]
	)

	const [platforms, setPlatforms] = useState<Platform[]>([])
	const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)

	useEffect(() => {
		setPlatforms((prev) =>
			basePlatforms.map((p) => {
				const prevP = prev.find((x) => x.id === p.id)
				return {
					...p,
					connected: profile?.connections?.includes(p.id) ?? false,
					isLoading: prevP?.isLoading ?? false,
				}
			})
		)
	}, [basePlatforms, profile?.connections])

	const handleConnectionClick = (platformId: string) => {
		if (!profile?.verified) {
			return showToast(t('settings.platforms.toastVerifyAccount'), 'error')
		}

		const platform = platforms.find((p) => p.id === platformId)
		if (!platform) {
			return showToast(t('settings.platforms.toastPlatformUnavailable'), 'error')
		}

		if (!platform.isActive && !platform.connected) {
			return showToast(t('settings.platforms.toastPlatformNotReady'), 'error')
		}

		setSelectedPlatform(platform)
		setIsModalOpen(true)
		Analytics.event(
			`connection_${platform.id}_${platform.connected ? 'disconnect' : 'connect'}_modal`
		)
	}

	const handleConnectionConfirm = async () => {
		if (!selectedPlatform) return

		setSelectedPlatform((prev) => (prev ? { ...prev, isLoading: true } : prev))

		try {
			if (selectedPlatform.connected) {
				const api = await getMainClient()
				await api.post(`/${selectedPlatform.id}/disconnect`)

				setPlatforms((prev) =>
					prev.map((p) =>
						p.id === selectedPlatform.id
							? { ...p, connected: false, isLoading: false }
							: p
					)
				)

				showToast(
					t('settings.platforms.toastDisconnected', { name: selectedPlatform.name }),
					'success'
				)
			} else {
				const api = await getMainClient()
				const response = await api.post(`/${selectedPlatform.id}/connect`)

				window.location.href = response.data.url
			}
		} catch {
			setPlatforms((prev) =>
				prev.map((p) =>
					p.id === selectedPlatform.id ? { ...p, isLoading: false } : p
				)
			)

			showToast(
				t('settings.platforms.toastConnectionError', { name: selectedPlatform.name }),
				'error'
			)
		}

		setIsModalOpen(false)
		setSelectedPlatform(null)
	}

	const handleModalClose = () => {
		setIsModalOpen(false)
		setSelectedPlatform(null)
	}

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-1 gap-2 mt-3 sm:grid-cols-2">
				{platforms.map((platform) => (
					<div
						key={platform.id}
						role="button"
						tabIndex={0}
						onKeyDown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault()
								if ((platform.isActive || platform.connected) && platform.id) {
									handleConnectionClick(platform.id)
								}
							}
						}}
						onClick={() =>
							(platform.isActive || platform.connected) &&
							handleConnectionClick(platform.id)
						}
						className={`group relative p-2.5 rounded-2xl border transition-all duration-200 bg-base-200 border-base-300
                ${
					platform.connected ? '' : ' hover:bg-base-200/40'
				} ${!platform.isActive && !platform.connected ? 'opacity-50' : 'cursor-pointer active:scale-95'}`}
					>
						<div className="flex items-center justify-between gap-3">
							<div className="flex items-center gap-2.5 overflow-hidden">
								<div
									className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-lg ${platform.bgColor} text-white`}
								>
									{platform.icon}
								</div>
								<div className="overflow-hidden">
									<h3 className="text-[13px] font-bold text-content truncate">
										{platform.name}
									</h3>
									<p
										className={`text-[10px]  font-medium truncate ${platform.connected ? 'text-success' : 'text-muted'}`}
									>
										{platform.connected
											? t('settings.platforms.statusConnected')
											: t('settings.platforms.statusDisconnected')}
									</p>
								</div>
							</div>

							<div
								className={`h-7 px-3 flex items-center justify-center rounded-lg text-[10px] font-black shrink-0 transition-all
                    ${
						platform.connected
							? 'bg-error/10 text-error'
							: 'bg-primary text-white'
					} ${!platform.isActive && !platform.connected ? 'bg-base-300! text-muted' : ''}`}
							>
								{platform.isLoading ? (
									<div className="w-3 h-3 border-2 border-current rounded-full animate-spin border-t-transparent" />
								) : platform.connected ? (
									t('settings.platforms.actionDisconnect')
								) : (
									t('settings.platforms.actionConnect')
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			<ConnectionModal
				platform={selectedPlatform}
				isOpen={isModalOpen}
				onClose={handleModalClose}
				onConfirm={handleConnectionConfirm}
				isLoading={selectedPlatform?.isLoading || false}
			/>
		</div>
	)
}
