import { useEffect, useState } from 'react'
import { FaExternalLinkAlt } from 'react-icons/fa'
import keepItImage from '@/assets/keep-it.png'
import { Button } from './button/button'
import Checkbox from './checkbox'
import Modal from './modal'
import { useTranslation } from 'react-i18next'

interface ExtensionInstalledModalProps {
	show: boolean
	onClose: () => void
	onGetStarted: () => void
}
export function ExtensionInstalledModal({
	show,
	onGetStarted,
}: ExtensionInstalledModalProps) {
	const { i18n } = useTranslation()
	const isRtl = i18n.language.startsWith('fa')

	return (
		<Modal
			isOpen={show}
			onClose={() => {}}
			size="sm"
			direction={isRtl ? 'rtl' : 'ltr'}
			showCloseButton={false}
			closeOnBackdropClick={false}
		>
			{import.meta.env.FIREFOX ? (
				<StepFirefoxConsent onGetStarted={onGetStarted} />
			) : (
				<StepOne onGetStarted={onGetStarted} />
			)}
		</Modal>
	)
}
interface StepOneProps {
	onGetStarted: () => void
}
const StepOne = ({ onGetStarted }: StepOneProps) => {
	const { t } = useTranslation()

	return (
		<>
			<div className="mb-3">
				<h3 className={'mb-0 text-2xl font-bold text-content inline-flex items-baseline gap-1'}>
					{t('extensionInstalled.welcomeTitle')}
					<GlitchFrix /> 🎉
				</h3>
			</div>

			<div
				className={
					'relative p-1 mt-1 mb-3 border rounded-xl border-content bg-content'
				}
			>
				<div className="flex items-center justify-center">
					<img
						src={keepItImage}
						alt={t('extensionInstalled.keepItAlt')}
						className="h-auto max-w-full rounded-lg shadow-xl"
						style={{ maxHeight: '220px' }}
					/>
				</div>
			</div>

			<div
				className={
					'p-3 mb-2 text-content rounded-lg border border-content  bg-content'
				}
			>
				<p className="font-bold text-muted">
					{t('extensionInstalled.keepItHint')}
				</p>
			</div>

			<Button
				size="md"
				onClick={onGetStarted}
				className="w-full text-base font-light shadow-sm rounded-2xl shadow-primary outline-none!"
				isPrimary={true}
			>
				{t('extensionInstalled.getStarted')}
			</Button>
		</>
	)
}

function GlitchFrix() {
	const [isGlitching, setIsGlitching] = useState(false)

	useEffect(() => {
		let cancelled = false
		const timers: number[] = []

		const schedule = (fn: () => void, ms: number) => {
			const id = window.setTimeout(() => {
				if (!cancelled) fn()
			}, ms)
			timers.push(id)
		}

		const trigger = () => {
			if (cancelled) return
			setIsGlitching(true)
			schedule(() => {
				setIsGlitching(false)
				const nextDelay = Math.random() * 2500 + 500
				schedule(trigger, nextDelay)
			}, 300)
		}

		schedule(trigger, 800)

		return () => {
			cancelled = true
			for (const id of timers) window.clearTimeout(id)
		}
	}, [])

	return (
		<span
			className={`glitch-frix text-2xl font-bold text-primary ${isGlitching ? 'is-glitching' : ''}`}
			data-text="Frix"
		>
			Frix
		</span>
	)
}

interface StepFirefoxConsentProps {
	onGetStarted: () => void
}
const StepFirefoxConsent = ({ onGetStarted }: StepFirefoxConsentProps) => {
	const { t, i18n } = useTranslation()
	const isRtl = i18n.language.startsWith('fa')

	const [allowAnalytics, setAllowAnalytics] = useState(false)
	const [allowIcon, setAllowIcon] = useState(false)

	const handleDecline = () => {
		if (browser.management?.uninstallSelf) {
			// @ts-expect-error
			browser.management.uninstallSelf({
				showConfirmDialog: true,
				dialogMessage:
					'⚠️ Without data permission, the extension cannot function. Do you want to uninstall it? ⚠️',
			})
		}
	}

	const handleConfirm = () => {
		localStorage.setItem('wxt_local:allowAnalytics', String(allowAnalytics))
		localStorage.setItem('wxt_local:allowFaviconService', String(allowIcon))

		onGetStarted()
	}

	return (
		<div className="w-full overflow-clip" dir={isRtl ? 'rtl' : 'ltr'}>
			<h3 className="mb-3 text-2xl font-bold text-content">
				{t('extensionInstalled.firefox.title')}
			</h3>
			<p className="mb-2 text-sm font-semibold">
				{t('extensionInstalled.firefox.description')}
			</p>

			<div className="w-full px-2">
				<ul className="w-full h-32 p-2 mb-2 space-y-1 overflow-y-auto text-xs list-disc list-inside border border-content rounded-2xl">
					<li>{t('extensionInstalled.firefox.points.localSettings')}</li>
					<li>{t('extensionInstalled.firefox.points.icons')}</li>
					<li>{t('extensionInstalled.firefox.points.sync')}</li>
				</ul>

				<div className="mb-3 space-y-2">
					<label className="flex items-center p-2 text-sm rounded-lg cursor-pointer hover:bg-base-200">
						<Checkbox
							checked={allowAnalytics}
							onChange={() => setAllowAnalytics(!allowAnalytics)}
						/>
						<span className={isRtl ? 'mr-2' : 'ml-2'}>
							{t('extensionInstalled.firefox.allowAnalytics')}
						</span>
					</label>

					<label className="flex items-center p-2 text-sm rounded-lg cursor-pointer hover:bg-base-200">
						<Checkbox
							checked={allowIcon}
							onChange={() => setAllowIcon(!allowIcon)}
						/>
						<span className={isRtl ? 'mr-2' : 'ml-2'}>
							{t('extensionInstalled.firefox.allowIcons')}
						</span>
					</label>
				</div>

				<a
					href="https://widgetify.ir/privacy"
					target="_blank"
					rel="noopener noreferrer"
					className="flex items-center justify-center mb-2 font-medium underline text-primary gap-0.5"
				>
					<FaExternalLinkAlt />
					{t('extensionInstalled.firefox.privacyLink')}
				</a>
			</div>

			<div className="flex gap-3 mt-4">
				<Button
					onClick={handleDecline}
					size="md"
					className="flex items-center justify-center w-40 btn btn-error rounded-xl"
				>
					{t('extensionInstalled.firefox.decline')}
				</Button>
				<Button
					onClick={handleConfirm}
					size="md"
					className="w-40 btn btn-success rounded-xl"
				>
					{t('extensionInstalled.firefox.confirm')}
				</Button>
			</div>
		</div>
	)
}
