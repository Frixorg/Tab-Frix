import { useEffect, useState, useRef } from 'react'
import { RiCheckboxCircleLine, RiThumbUpLine, RiLayoutLine } from 'react-icons/ri'
import { useTranslation } from 'react-i18next'
import { Button } from './button/button'
import Modal from './modal'
import { ConfigKey } from '@/common/constant/config.key'
import { callEvent } from '@/common/utils/call-event'
import Analytics from '@/analytics'

type MediaContent = {
	type: 'image' | 'video'
	url: string
	caption?: string
}

type ReleaseNote = {
	type: 'feature' | 'bugfix' | 'improvement' | 'info'
	title: string
	description: string
	media?: MediaContent[]
}

const VERSION_NAME = ConfigKey.VERSION_NAME
// ignore for this update
const releaseNotes: ReleaseNote[] = []

type UpdateReleaseNotesModalProps = {
	isOpen: boolean
	onClose: () => void
	counterValue: number | null
}

export const UpdateReleaseNotesModal = ({
	isOpen,
	onClose,
	counterValue,
}: UpdateReleaseNotesModalProps) => {
	const { t, i18n } = useTranslation()
	const [counter, setCounter] = useState<number>(0)
	const [activated, setActivated] = useState<boolean>(false)
	const videoRef = useRef<HTMLVideoElement>(null)

	useEffect(() => {
		if (isOpen && counterValue !== null) {
			setCounter(counterValue === null ? 10 : counterValue)
			const interval = setInterval(() => {
				setCounter((prev) => {
					if (prev <= 1) {
						clearInterval(interval)
						return 0
					}
					return prev - 1
				})
			}, 1000)
			return () => clearInterval(interval)
		} else {
			setCounter(0)
		}
	}, [isOpen, counterValue])

	useEffect(() => {
		if (isOpen && videoRef.current) {
			videoRef.current.play().catch(() => { })
		}
	}, [isOpen])

	const handleActivate = () => {
		callEvent('ui_change', 'SIMPLE')
		setActivated(true)
		Analytics.event('release_modal_active_ui')
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t('releaseNotes.modalTitle')}
			size="lg"
			direction={i18n.language === 'fa' ? 'rtl' : 'ltr'}
			closeOnBackdropClick={false}
		>
			<div className="flex flex-col max-h-[80vh]">
				<div className="flex items-center justify-between px-1 pb-1">
					<div className="flex flex-col">
						<p className="mt-1 text-xs font-medium text-muted">
							{t('releaseNotes.subtitle')}
						</p>
					</div>
				</div>

				<div className="pb-2 space-y-4 overflow-y-auto h-110">
					{/* <div className="relative w-full overflow-hidden border-2 shadow-inner rounded-2xl bg-base-300/20 border-base-300">
						<video
							ref={videoRef}
							src={'https://cdn.widgetify.ir/extension/new_ui_update.mp4'}
							autoPlay
							muted
							loop
							playsInline
							className="object-cover w-full max-h-70 rounded-2xl"
						/>
						<div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
							<span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
							<span className="text-[10px] font-bold text-white/80">
								{t('releaseNotes.videoCaption')}
							</span>
						</div>
					</div> */}

					<div className="p-4 space-y-3 border rounded-2xl bg-base-300/20 border-base-300/10">
						<div className="flex items-center gap-2">
							<RiLayoutLine className="text-primary shrink-0" size={20} />
							<h3 className="text-sm font-black text-content">
								{t('releaseNotes.newUiTitle')}
							</h3>
						</div>
						<p className="text-xs leading-6 text-muted">
							{t('releaseNotes.newUiDescriptionPart1')}
							<span className="font-bold text-content">
								{t('releaseNotes.newUiDescriptionBold')}
							</span>
							{t('releaseNotes.newUiDescriptionPart2')}
						</p>
						<ul className="space-y-1">
							{[0, 1, 2, 3].map((idx) => (
								<li
									key={idx}
									className="flex items-center gap-2 text-xs text-muted"
								>
									<RiCheckboxCircleLine
										className="text-green-500 shrink-0"
										size={14}
									/>
									{t(`releaseNotes.features.${idx}`)}
								</li>
							))}
						</ul>

						<button
							onClick={handleActivate}
							disabled={activated}
							className={`w-full py-2.5 rounded-xl cursor-pointer text-xs font-black transition-all active:scale-95 border ${activated
								? 'bg-green-500/10 border-green-500/30 text-green-500 cursor-default'
								: 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20'
								}`}
						>
							{activated ? (
								<span className="flex items-center justify-center gap-2">
									<RiCheckboxCircleLine size={14} />
									{t('releaseNotes.activatedText')}
								</span>
							) : (
								<span className="flex items-center justify-center gap-2">
									{t('releaseNotes.activateAction')}
								</span>
							)}
						</button>
					</div>

					<div className="flex items-center justify-center gap-2 py-1 text-muted">
						<RiThumbUpLine size={14} />
						<span className="text-xs">{t('releaseNotes.thanks')}</span>
					</div>
				</div>

				<div className="flex items-center justify-between px-4 py-2 border border-t border-base-300/10 bg-base-200/40 rounded-3xl">
					<a
						href="https://feedback.widgetify.ir"
						target="_blank"
						rel="noreferrer"
						className="text-[10px] font-black text-muted hover:text-content transition-all underline decoration-dotted underline-offset-4"
					>
						{t('releaseNotes.feedbackLink')}
					</a>
					<Button
						size="sm"
						onClick={onClose}
						disabled={counter > 0}
						className="min-w-[130px] h-11 !rounded-2xl font-black text-xs shadow-lg shadow-primary/10 disabled:shadow-none active:scale-90 transition-all disabled:text-base-content/30"
						isPrimary={true}
					>
						{counter > 0
							? t('releaseNotes.waitButton', { counter })
							: t('releaseNotes.gotIt')}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
