import Analytics from '@/analytics'
import { Button } from '@/components/button/button'
import Modal from '@/components/modal'
import { showToast } from '@/common/toast'

interface Prop {
	showRequireNotificationModal: boolean
	setShowRequireNotificationModal: (value: boolean) => void
	startPomodoro: () => void
}
import { useLanguage } from '@/context/language.context'
export function RequestNotificationModal({
	showRequireNotificationModal,
	setShowRequireNotificationModal,
	startPomodoro,
}: Prop) {
	useEffect(() => {
		if (showRequireNotificationModal)
			Analytics.event('view_request_notification_modal')
	}, [showRequireNotificationModal])

	const { t } = useLanguage()

	async function onRequestPermission() {
		try {
			const perm = await Notification.requestPermission()
			if (perm === 'granted') {
				showToast(t('widgets.pomodoro.notifEnabled'), 'success')
				setShowRequireNotificationModal(false)
				startPomodoro()
				Analytics.event('grant_notification_permission')
			} else {
				showToast(t('widgets.pomodoro.notifNeeded'), 'error')
				Analytics.event('deny_notification_permission')
			}
		} catch {
			showToast(t('widgets.pomodoro.notifError'), 'error')
		}
	}

	return (
		<Modal
			isOpen={showRequireNotificationModal}
			onClose={() => setShowRequireNotificationModal(false)}
			size="sm"
			title={t('widgets.pomodoro.notifTitle')}
			direction="rtl"
		>
			<div className="p-4 max-h-[80vh] overflow-y-auto">
				<article className="pb-4 border-b blog-post border-content animate-fade-in animate-slide-up">
					{/* Type badge and title */}
					<div className="flex items-start justify-between mb-3">
						<h3 className="text-xl font-bold text-content">
							{t('widgets.pomodoro.notifHeading')}
						</h3>
					</div>

					<div className="media-container">
						<div className="my-2 overflow-hidden rounded-lg shadow-md">
							<img
								src={
									'https://cdn.widgetify.ir/extension/pomodoroTimer-notification.png'
								}
								alt={t('widgets.pomodoro.notifSampleAlt')}
								className="object-cover w-full h-auto"
							/>
							<p className="p-2 text-xs text-center text-muted bg-content/30">
								{t('widgets.pomodoro.notifSampleCaption')}
							</p>
						</div>
					</div>

					{/* Content */}
					<div className="mt-2">
						<p className="leading-relaxed text-justify text-muted">
							{t('widgets.pomodoro.notifBody')}
						</p>
					</div>
				</article>

				{/* Actions */}
				<div className="flex gap-3 mt-2">
					<Button
						onClick={() => {
							setShowRequireNotificationModal(false)
						}}
						className="flex-1 px-4 py-2 text-sm font-medium transition-colors border rounded-2xl border-content text-content"
						size="md"
					>
						{t('widgets.pomodoro.notLater')}
					</Button>
					<Button
						isPrimary={true}
						size="md"
						onClick={onRequestPermission}
						className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors rounded-2xl"
					>
						{t('widgets.pomodoro.notifTitle')}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
