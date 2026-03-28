import { useTranslation } from 'react-i18next'
import { callEvent } from '@/common/utils/call-event'
import type { Wallpaper } from '@/common/wallpaper.interface'
import { Button } from '@/components/button/button'
import Modal from '@/components/modal'
import { wallpaperLabel } from '@/i18n/wallpaper-labels'
import { UserCoin } from '@/layouts/setting/tabs/account/components/user-coin'

interface CoinPurchaseModalProps {
	isOpen: boolean
	onClose: () => void
	wallpaper: Wallpaper | null
	onBuy: () => void
	isBuying?: boolean
}

export function CoinPurchaseModal({
	isOpen,
	onClose,
	wallpaper,
	onBuy,
	isBuying = false,
}: CoinPurchaseModalProps) {
	const { t, i18n } = useTranslation()

	if (!wallpaper) return null

	const onLogin = () => {
		onClose()
		callEvent('openProfile')
	}

	const dir = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'
	const displayName = wallpaperLabel(wallpaper, t)

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			size="md"
			direction={dir}
			closeOnBackdropClick={!isBuying}
			showCloseButton={!isBuying}
			title=" "
		>
			<div className="space-y-4">
				<div className="relative overflow-hidden rounded-lg aspect-video">
					{wallpaper.type === 'IMAGE' ? (
						<img
							src={wallpaper.previewSrc}
							alt={displayName}
							className="object-cover w-full h-full rounded"
						/>
					) : (
						<video
							src={wallpaper.src}
							className="object-cover w-full h-full"
							loop
							muted
							playsInline
							autoPlay
						/>
					)}
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold text-content">
							{displayName || t('settings.wallpapers.coin.defaultWallpaperName')}
						</h3>
						<UserCoin
							coins={wallpaper.coin || 0}
							title={t('settings.wallpapers.coin.priceTitle')}
						/>
					</div>
					<p className="text-sm text-muted">{t('settings.wallpapers.coin.unlockHint')}</p>
					<div className="flex items-center gap-2 p-3 border rounded-xl bg-primary/5 border-primary/20 backdrop-blur-sm">
						<span className="text-sm">💡</span>
						<p className="text-xs text-primary/80">
							{t('settings.wallpapers.coin.earnHint')}
						</p>
					</div>
				</div>

				<div className="flex gap-3 pt-4">
					{true ? (
						<>
							<Button
								onClick={onClose}
								size="md"
								className="flex-1 text-content border-muted hover:bg-muted/50 rounded-2xl"
							>
								{t('settings.wallpapers.coin.cancel')}
							</Button>
							<Button
								onClick={onBuy}
								size="md"
								disabled={isBuying}
								loading={isBuying}
								loadingText={t('settings.wallpapers.coin.unlocking')}
								className="flex-1 text-white transition-all duration-200 border-none shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-2xl"
							>
								🔓 {t('settings.wallpapers.coin.unlock')}
							</Button>
						</>
					) : (
						<Button
							size="md"
							onClick={onLogin}
							className="flex-1 text-white transition-all duration-200 border-none shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-2xl"
						>
							{t('settings.wallpapers.coin.login')}
						</Button>
					)}
				</div>
			</div>
		</Modal>
	)
}
