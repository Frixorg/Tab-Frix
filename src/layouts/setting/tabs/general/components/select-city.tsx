import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CiLocationOn } from 'react-icons/ci'
import Analytics from '@/analytics'
import { IconLoading } from '@/components/loading/icon-loading'
import Modal from '@/components/modal'
import { SectionPanel } from '@/components/section-panel'
import { useGetCitiesList } from '@/services/hooks/cities/getCitiesList'
import { useSetCity } from '@/services/hooks/user/userService.hook'
import { TextInput } from '@/components/text-input'
import { showToast } from '@/common/toast'
import { translateError } from '@/utils/translate-error'

interface SelectedCity {
	city: string
	cityId: string
}

interface Prop {
	size?: 'lg' | 'xs'
	onSave?: () => void
}
export function SelectCity({ size, onSave }: Prop) {
	const { t, i18n } = useTranslation()
	const modalDir = i18n.language.startsWith('fa') ? 'rtl' : 'ltr'

	const [searchTerm, setSearchTerm] = useState('')
	const [isModalOpen, setIsModalOpen] = useState(false)
	const searchInputRef = useRef<HTMLInputElement>(null)
	const { data: cities, isLoading, error } = useGetCitiesList(true)
	const { mutateAsync: setCityToServer, isPending: isSettingCity } = useSetCity()

	const filteredCities = useMemo(() => {
		if (!cities || !searchTerm) return cities || []

		const lowerSearchTerm = searchTerm.toLowerCase()

		const prefixMatches = cities.filter((city) =>
			city.city.toLowerCase().startsWith(lowerSearchTerm)
		)

		const remainingCities = cities.filter(
			(city) =>
				!city.city.toLowerCase().startsWith(lowerSearchTerm) &&
				city.city.toLowerCase().includes(lowerSearchTerm)
		)

		return [...prefixMatches, ...remainingCities]
	}, [cities, searchTerm])

	const handleSelectCity = async (city: SelectedCity) => {
		if (!city.cityId) return
		try {
			setIsModalOpen(false)
			setSearchTerm('')

			Analytics.event('city_selected')

			await setCityToServer(city.cityId)
			onSave?.()
		} catch (error) {
			showToast(translateError(error) as any, 'error')
		}
	}

	const onModalOpen = () => {
		setIsModalOpen(true)
		Analytics.event('open_city_selection_modal')
		setTimeout(() => {
			searchInputRef.current?.focus()
		}, 300)
	}

	return (
		<SectionPanel title={t('settings.general.city.title')} size={size ? size : 'sm'}>
			<div className="space-y-2">
				<button
					type="button"
					onClick={onModalOpen}
					disabled={isSettingCity}
					className="flex items-center justify-between w-full p-3 text-end transition-colors border cursor-pointer rounded-2xl bg-base-100 border-base-300 hover:bg-base-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? (
						<IconLoading className="mx-auto text-center" />
					) : (
						t('settings.general.city.choosePlaceholder')
					)}
					{isSettingCity ? (
						<IconLoading />
					) : (
						<CiLocationOn className="w-5 h-5 text-primary shrink-0" />
					)}
				</button>

				{error && (
					<div className="p-3 text-sm text-end duration-300 border rounded-lg border-error/20 bg-error/10 backdrop-blur-sm animate-in fade-in-0">
						<div className="font-medium text-error">{t('settings.general.city.errorTitle')}</div>
						<div className="mt-1 text-error/80">{t('settings.general.city.errorHint')}</div>
					</div>
				)}
			</div>
			<Modal
				isOpen={isModalOpen}
				onClose={() => {
					setIsModalOpen(false)
					setSearchTerm('')
				}}
				title={t('settings.general.city.modalTitle')}
				size="lg"
				direction={modalDir}
			>
				<div className="space-y-2 overflow-hidden">
					<div className="relative">
						<TextInput
							type="text"
							placeholder={t('settings.general.city.searchPlaceholder')}
							value={searchTerm}
							ref={searchInputRef}
							onChange={(value) => setSearchTerm(value)}
						/>
						<CiLocationOn className="absolute w-5 h-5 transform -translate-y-1/2 top-1/2 start-3 text-base-content/40" />
					</div>

					<div className="overflow-y-auto min-h-52 max-h-52 custom-scrollbar">
						{isLoading ? (
							<div className="flex items-center justify-center gap-2 p-4 text-center text-primary">
								<IconLoading />
								{t('settings.general.city.loading')}
							</div>
						) : filteredCities && filteredCities.length > 0 ? (
							filteredCities.map((city) => (
								<div
									key={city.cityId}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault()
											void handleSelectCity(city)
										}
									}}
									onClick={() => handleSelectCity(city)}
									className="flex items-center w-full p-3 text-end transition-all duration-200 border-b cursor-pointer border-base-200/30 last:border-b-0 group rounded-2xl hover:bg-primary/20 hover:text-primary"
								>
									<CiLocationOn className="flex-shrink-0 w-5 h-5 me-3 transition-transform text-primary group-hover:scale-110" />
									<span className="flex-1 font-medium">{city.city}</span>
								</div>
							))
						) : searchTerm ? (
							<div className="p-4 text-center text-base-content/60">
								{t('settings.general.city.noResults')}
							</div>
						) : cities && cities.length === 0 ? (
							<div className="p-4 text-center text-base-content/60">
								{t('settings.general.city.noCitiesAvailable')}
							</div>
						) : (
							<div className="p-4 text-center text-base-content/60">
								{t('settings.general.city.searchPrompt')}
							</div>
						)}
					</div>

					<div className="pt-2 border-t border-base-300">
						<p className="text-sm text-center text-base-content/60">
							{t('settings.general.city.footerQuestion')}{' '}
							<a
								href="https://feedback.widgetify.ir"
								target="_blank"
								rel="noopener noreferrer"
								className="font-medium text-primary hover:underline"
								onClick={() =>
									Analytics.event('feedback_link_clicked', {
										source: 'city_selection',
									})
								}
							>
								{t('settings.general.city.feedbackLink')}
							</a>
						</p>
					</div>
				</div>
			</Modal>
		</SectionPanel>
	)
}
