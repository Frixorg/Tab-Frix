import { useState, useMemo, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { CiLocationOn } from 'react-icons/ci'
import Analytics from '@/analytics'
import { getFromStorage } from '@/common/storage'
import { IconLoading } from '@/components/loading/icon-loading'
import Modal from '@/components/modal'
import { SectionPanel } from '@/components/section-panel'
import { useGetCitiesList } from '@/services/hooks/cities/getCitiesList'
import { useGeocoding, type GeocodingCity } from '@/services/hooks/cities/useGeocoding'
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
	const [selectedCity, setSelectedCity] = useState<{
		id: string
		name: string
		lat?: number
		lon?: number
	} | null>(null)
	const searchInputRef = useRef<HTMLInputElement>(null)
	const { data: builtinCities, isLoading: isLoadingBuiltin, error: errorBuiltin } = useGetCitiesList(true)
	const { data: geocodedCities, isLoading: isLoadingGeocoding, error: errorGeocoding } = useGeocoding(searchTerm)
	const { mutateAsync: setCityToServer, isPending: isSettingCity } = useSetCity()

	useEffect(() => {
		getFromStorage('selected_city').then((stored) => {
			if (stored) setSelectedCity(stored)
		})
	}, [])
	const normalizedCities = useMemo(
		() =>
			(builtinCities || []).map((item) => ({
				...item,
				searchKey: item.city.toLowerCase(),
			})),
		[builtinCities]
	)

	const filteredCities = useMemo(() => {
		if (searchTerm.trim().length >= 2) {
			return (geocodedCities || []).map((c) => ({
				cityId: String(c.id),
				city: `${c.name}, ${c.country}${c.admin1 ? `, ${c.admin1}` : ''}`,
				lat: c.latitude,
				lon: c.longitude,
			}))
		}

		if (!normalizedCities.length) return []
		const q = searchTerm.trim().toLowerCase()
		if (!q) return normalizedCities.slice(0, 10).map((c) => ({ ...c, lat: 35.696111, lon: 51.423056 })) // Default Tehran coordinates for builtin
		// ...rest of local filter logic would go here but we prefer geocoding if searchTerm is present
		return normalizedCities.filter(c => c.searchKey.includes(q)).slice(0, 10)
	}, [normalizedCities, searchTerm, geocodedCities])

	const handleSelectCity = async (city: any) => {
		if (!city.cityId) return
		try {
			setIsModalOpen(false)
			setSearchTerm('')

			Analytics.event('city_selected')

			await setCityToServer({
				cityId: city.cityId,
				city: city.city,
				lat: city.lat,
				lon: city.lon,
			})
			setSelectedCity({ id: city.cityId, name: city.city, lat: city.lat, lon: city.lon })
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
					{isLoadingBuiltin || (searchTerm.length >= 2 && isLoadingGeocoding) ? (
						<IconLoading className="mx-auto text-center" />
					) : selectedCity ? (
						<span className="font-medium text-content">{selectedCity.name}</span>
					) : (
						<span className="text-base-content/50">{t('settings.general.city.choosePlaceholder')}</span>
					)}
					{isSettingCity ? (
						<IconLoading />
					) : (
						<CiLocationOn className="w-5 h-5 text-primary shrink-0" />
					)}
				</button>

				{(errorBuiltin || (searchTerm.length >= 2 && errorGeocoding)) && (
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
						<CiLocationOn className={`absolute w-5 h-5 transform -translate-y-1/2 top-1/2 end-3 text-base-content/40`} />
					</div>

					<div className="overflow-y-auto min-h-52 max-h-52 custom-scrollbar">
						{isLoadingBuiltin || (searchTerm.length >= 2 && isLoadingGeocoding) ? (
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
									className="flex flex-row-reverse items-center w-full p-3 text-end transition-all duration-200 border-b cursor-pointer border-base-200/30 last:border-b-0 group rounded-2xl hover:bg-primary/20 hover:text-primary"
								>
									<CiLocationOn className="flex-shrink-0 w-5 h-5 me-3 transition-transform text-primary group-hover:scale-110" />
									<span
										className={`flex-1 font-medium ${modalDir === 'rtl' ? 'text-right' : 'text-left'}`}
									>
										{city.city}
									</span>
								</div>
							))
						) : searchTerm ? (
							<div className="p-4 text-center text-base-content/60">
								{t('settings.general.city.noResults')}
							</div>
						) : builtinCities && builtinCities.length === 0 ? (
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
