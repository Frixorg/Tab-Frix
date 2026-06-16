import { useAppearanceSetting } from '@/context/appearance.context'
import { useLanguage } from '@/context/language.context'
import { ContentSection } from './ui/content-section'
import { HomeContentSimplify } from './ui/home-content-simplify'
import { getFromStorage, setToStorage } from '@/common/storage'
import { ConfigKey } from '@/common/constant/config.key'
import { ExtensionInstalledModal } from '@/components/extension-installed-modal'
import Joyride, { type Step } from 'react-joyride'
import { UpdateReleaseNotesModal } from '@/components/UpdateReleaseNotesModal'
import Analytics from '@/analytics'
import { DialogChecker } from './dialog/dialog'
const buildSteps = (t: (key: string) => string): Step[] => [
	{
		target: '#chrome-footer',
		content: (
			<div className="flex flex-col gap-1 text-center">
				<h4 className="text-[14px] font-black text-primary italic">
					{t('tour.cleanBrowserTitle')}
				</h4>

				<p className="text-[12px] leading-6 text-content font-medium">
					{t('tour.cleanBrowserDesc')}
				</p>

				<div className="relative group">
					<img
						src="https://cdn.widgetify.ir/extension/how-to-disable-footer.png"
						alt={t('tour.cleanBrowserImageAlt')}
						className="object-cover w-full transition-transform duration-500 rounded-xl shadow-2xl border-2 border-primary/20 group-hover:scale-[1.02]"
					/>
					<div className="absolute inset-0 pointer-events-none rounded-xl bg-linear-to-t from-black/20 to-transparent" />
				</div>

				<div className="p-2 border border-dashed rounded-lg bg-base-100/10 border-base-100/20">
					<code className="text-[11px] font-bold text-content/60">
						"Hide footer on New Tab page"
					</code>
				</div>
			</div>
		),
		disableBeacon: true,
		showSkipButton: true,
		styles: {
			options: {
				width: 320,
				zIndex: 10000,
			},
		},
	},
	{
		target: '#settings-button',
		content: t('tour.settings'),
	},
	{
		target: '#profile-and-friends-list',
		content: t('tour.profile'),
	},
	{
		target: '#bookmarks',
		content: t('tour.bookmarks'),
	},
	{
		target: '#widgets',
		content: t('tour.widgets'),
	},
]

export function HomePage() {
	const { ui } = useAppearanceSetting()
	const { t } = useLanguage()
	const steps = buildSteps(t)
	const [showWelcomeModal, setShowWelcomeModal] = useState(false)
	const [showReleaseNotes, setShowReleaseNotes] = useState(false)
	const [showTour, setShowTour] = useState(false)
	const [appIsReady, setAppIsReady] = useState(false)

	const handleGetStarted = async () => {
		const [hasSeenTour] = await Promise.all([
			getFromStorage('hasSeenTour'),
			setToStorage('showWelcomeModal', false),
		])
		setShowWelcomeModal(false)
		if (!hasSeenTour) {
			setShowTour(true)
		}
	}

	function onDoneTour(data: any) {
		if (data.status === 'finished' || data.status === 'skipped') {
			setToStorage('hasSeenTour', true)
			setShowTour(false)
			Analytics.event(`tour_${data.status}`)
		}
	}

	const onCloseReleaseNotes = async () => {
		await setToStorage('lastVersion', ConfigKey.VERSION_NAME)
		setShowReleaseNotes(false)
	}

	useEffect(() => {
		async function displayModalIfNeeded() {
			const shouldShowWelcome = await getFromStorage('showWelcomeModal')

			if (shouldShowWelcome || shouldShowWelcome === null) {
				setShowWelcomeModal(true)
				return
			}

			const lastVersion = await getFromStorage('lastVersion')
			if (lastVersion !== ConfigKey.VERSION_NAME) {
				setShowReleaseNotes(true)
				return
			}

			setAppIsReady(true)
		}

		displayModalIfNeeded()
	}, [])

	return (
		<>
			{ui === 'ADVANCED' ? <ContentSection /> : <HomeContentSimplify />}

			{showWelcomeModal && (
				<ExtensionInstalledModal
					show={showWelcomeModal}
					onClose={() => handleGetStarted}
					onGetStarted={handleGetStarted}
				/>
			)}

			{appIsReady && <DialogChecker />}

			<Joyride
				steps={steps}
				run={showTour}
				continuous
				showProgress
				showSkipButton
				locale={{
					next: t('tour.next'),
					back: t('tour.back'),
					skip: t('tour.skip'),
					last: t('tour.last'),
					close: t('tour.close'),
					nextLabelWithProgress: `${t('tour.next')} {step}/{steps}`,
				}}
				callback={onDoneTour}
				styles={{
					options: {
						primaryColor: '#3b82f6',
					},
				}}
			/>

			{showReleaseNotes && (
				<UpdateReleaseNotesModal
					isOpen={showReleaseNotes}
					onClose={() => onCloseReleaseNotes()}
					counterValue={2}
				/>
			)}
		</>
	)
}
