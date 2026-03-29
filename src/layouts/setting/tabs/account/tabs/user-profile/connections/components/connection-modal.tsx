import { useTranslation } from 'react-i18next'
import { Button } from '@/components/button/button'
import Modal from '@/components/modal'
import type { Platform } from './platform-config'

interface ConnectionModalProps {
	platform: Platform | null
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	isLoading: boolean
}

export function ConnectionModal({
	platform,
	isOpen,
	onClose,
	onConfirm,
	isLoading,
}: ConnectionModalProps) {
	const { t, i18n } = useTranslation()
	const direction = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'

	if (!platform) return null

	const heading = platform.connected
		? t('settings.platforms.headingDisconnect', { name: platform.name })
		: t('settings.platforms.headingConnect', { name: platform.name })

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('settings.platforms.modalTitle')}
			direction={direction}
		>
			<div className="p-4">
				<div className="flex items-center gap-3 mb-4">
					<div
						className={`flex items-center justify-center w-10 h-10 ${platform.bgColor} rounded-lg`}
					>
						{platform.icon}
					</div>
					<h2 className="text-xl font-semibold text-content">{heading}</h2>
				</div>

				<div className="mb-6">
					{platform.connected ? (
						<div className="space-y-2">
							<p className="text-content">
								{t('settings.platforms.disconnectConfirm', { name: platform.name })}
							</p>
							<div className="p-3 text-sm rounded-2xl text-warning-content bg-warning/80">
								{t('settings.platforms.disconnectWarning')}
							</div>
						</div>
					) : (
						<div className="space-y-3">
							<p className="text-content">{platform.description}</p>
							{platform.features && platform.features.length > 0 && (
								<div>
									<p className="mb-2 text-sm font-medium text-content">
										{t('settings.platforms.featuresLabel')}
									</p>
									<ul className="space-y-1">
										{platform.features.map((feature: string, index: number) => (
											<li
												key={index}
												className="flex items-center gap-2 text-sm text-muted"
											>
												<span className="w-1.5 h-1.5 bg-primary rounded-full" />
												{feature}
											</li>
										))}
									</ul>
								</div>
							)}
							{platform.permissions && platform.permissions.length > 0 && (
								<div>
									<p className="mb-2 text-sm font-medium text-content">
										{t('settings.platforms.permissionsLabel')}
									</p>
									<ul className="space-y-1">
										{platform.permissions.map((permission: string, index: number) => (
											<li
												key={index}
												className="flex items-center gap-2 text-sm text-muted"
											>
												<span className="w-1.5 h-1.5 bg-secondary rounded-full" />
												{permission}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
				</div>

				<div className="flex justify-end gap-3">
					<Button
						size="sm"
						onClick={onClose}
						disabled={isLoading}
						className="flex-1 text-xs font-bold border-none cursor-pointer h-9 rounded-xl bg-base-200 text-content hover:bg-base-300/90"
					>
						{t('settings.platforms.cancel')}
					</Button>
					<Button
						size="sm"
						onClick={() => (isLoading ? undefined : onConfirm())}
						loading={isLoading}
						loadingText={
							<span className="flex items-center justify-center gap-2">
								<div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
								{t('settings.platforms.processing')}
							</span>
						}
						className={`flex-[2] h-9 rounded-xl font-black text-sm transition-all shadow-sm active:scale-95
                    ${platform.connected ? 'bg-error text-white' : 'bg-primary text-white'}`}
					>
						{platform.connected
							? t('settings.platforms.confirmDisconnect')
							: t('settings.platforms.confirmConnect')}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
