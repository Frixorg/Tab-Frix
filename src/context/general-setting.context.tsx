import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import { resolveGeoDefaults, type GeoDefaultsResult } from '@/services/geo/resolve-geo-defaults'
import { useUpdateExtensionSettings } from '@/services/hooks/extension/updateSetting.hook'
import type { FetchedTimezone } from '@/services/hooks/timezone/getTimezones.hook'

export interface GeneralData {
	blurMode: boolean
	analyticsEnabled: boolean
	selected_timezone: FetchedTimezone
	browserBookmarksEnabled: boolean
	browserTabsEnabled: boolean
}

interface GeneralSettingContextType extends GeneralData {
	updateSetting: <K extends keyof GeneralData>(key: K, value: GeneralData[K]) => void
	setAnalyticsEnabled: (value: boolean) => void
	setTimezone: (value: FetchedTimezone) => void
	setBrowserBookmarksEnabled: (value: boolean) => void
	setBrowserTabsEnabled: (value: boolean, event?: React.MouseEvent) => void
}

const DEFAULT_SETTINGS: GeneralData = {
	blurMode: false,
	analyticsEnabled: import.meta.env.FIREFOX ? false : true,
	selected_timezone: {
		label: 'آسیا / تهران',
		value: 'Asia/Tehran',
		offset: '+03:30',
	},
	browserBookmarksEnabled: false,
	browserTabsEnabled: false,
}

const GEO_DEFAULTS_APPLIED_KEY = 'geo_defaults_applied_v2'

export const GeneralSettingContext = createContext<GeneralSettingContextType | null>(null)

export function GeneralSettingProvider({ children }: { children: React.ReactNode }) {
	const [settings, setSettings] = useState<GeneralData>(DEFAULT_SETTINGS)
	const [isInitialized, setIsInitialized] = useState(false)
	const { mutateAsync } = useUpdateExtensionSettings()

	useEffect(() => {
		async function loadGeneralSettings() {
			try {
				const storedSettings = await getFromStorage('generalSettings')
				const [browserBookmarksEnabled, browserTabsEnabled] = await Promise.all([
					browserHasPermission(['bookmarks']),
					browserHasPermission(['tabs', 'tabGroups']),
				])

				if (storedSettings) {
					setSettings({
						...DEFAULT_SETTINGS,
						...storedSettings,
						selected_timezone:
							typeof storedSettings.selected_timezone === 'string'
								? DEFAULT_SETTINGS.selected_timezone
								: storedSettings.selected_timezone,
						browserBookmarksEnabled: browserBookmarksEnabled,
						browserTabsEnabled: browserTabsEnabled,
					})
				}
			} finally {
				setIsInitialized(true)
			}
		}

		loadGeneralSettings()
	}, [])

	useEffect(() => {
		if (!isInitialized) return

		let cancelled = false

		void (async () => {
			const applied = await getFromStorage(GEO_DEFAULTS_APPLIED_KEY)
			const storedSettings = await getFromStorage('generalSettings')
			const storedTimezone = storedSettings?.selected_timezone
			const hasValidStoredTimezone =
				typeof storedTimezone === 'object' &&
				typeof storedTimezone?.value === 'string' &&
				storedTimezone.value.length > 0
			const shouldApplyGeoDefaults =
				!applied ||
				!hasValidStoredTimezone ||
				storedTimezone.value === DEFAULT_SETTINGS.selected_timezone.value
			if (!shouldApplyGeoDefaults || cancelled) return

			let result: GeoDefaultsResult | null = null
			try {
				result = await resolveGeoDefaults()
			} catch {
				return
			}

			if (cancelled || !result) return

			const { timezone, cityId, cityName } = result

			setSettings((prev) => {
				const next: GeneralData = { ...prev, selected_timezone: timezone }
				void setToStorage('generalSettings', next)
				return next
			})

			try {
				await mutateAsync({ timeZone: timezone.value })
			} catch {
				// offline / unauthenticated extension sync
			}

			if (cityId && cityName) {
				const profile = await getFromStorage('profile')
				if (profile) {
					await setToStorage('profile', {
						...profile,
						city: { id: cityId, name: cityName },
						inCache: true,
					})
				}
			}

			await setToStorage(GEO_DEFAULTS_APPLIED_KEY, true)
		})()

		return () => {
			cancelled = true
		}
	}, [isInitialized, mutateAsync])

	async function browserHasPermission(
		permissions: Browser.runtime.ManifestPermissions[]
	) {
		return browser.permissions.contains({ permissions })
	}

	const updateSetting = <K extends keyof GeneralData>(
		key: K,
		value: GeneralData[K]
	) => {
		setSettings((prevSettings) => {
			const newSettings = {
				...prevSettings,
				[key]: value,
			}

			setToStorage('generalSettings', newSettings)
			return newSettings
		})
	}

	const setAnalyticsEnabled = (value: boolean) => {
		updateSetting('analyticsEnabled', value)
	}
	const setTimezone = async (value: FetchedTimezone) => {
		updateSetting('selected_timezone', value)
		await mutateAsync({ timeZone: value.value })
	}

	//#region [⚠️ Important note:]
	// In Firefox, browser.permissions.request can only be called directly
	// from a user input handler (like a click event).
	// Using async/await breaks this direct connection and Firefox throws an error.
	// Therefore, these functions are written entirely without async/await
	// and use Promise chaining instead.
	//#endregion
	const togglePermission =
		(
			permissions: Browser.runtime.ManifestPermissions[],
			settingKey: keyof GeneralData,
			enableEvent: string,
			disableEvent: string
		) =>
		(value: boolean) => {
			if (import.meta.env.FIREFOX) {
				if (value) {
					browser.permissions
						.request({ permissions })
						.then((granted) => {
							if (granted) {
								updateSetting(settingKey, true)
								Analytics.event(enableEvent)
							}
						})
						.catch(console.error)
				} else {
					browser.permissions
						.remove({ permissions })
						.then(() => {
							updateSetting(settingKey, false)
							Analytics.event(disableEvent)
						})
						.catch(console.error)
				}
			} else {
				browser.permissions.contains({ permissions }).then((hasPermission) => {
					if (value) {
						browser.permissions
							.request({ permissions })
							.then((granted) => {
								if (granted) {
									updateSetting(settingKey, true)
									Analytics.event(enableEvent)
								} else {
									console.log('Permission denied')
								}
							})
							.catch(console.error)
					} else {
						if (!hasPermission) {
							updateSetting(settingKey, false)
							return
						}

						Analytics.event(disableEvent)

						browser.permissions
							.remove({ permissions })
							.then(() => {
								updateSetting(settingKey, false)
							})
							.catch(() => {
								updateSetting(settingKey, false)
							})
					}
				})
			}
		}

	const setBrowserBookmarksEnabled = togglePermission(
		['bookmarks'],
		'browserBookmarksEnabled',
		'browser_bookmarks_enabled',
		'browser_bookmarks_disabled'
	)

	const setBrowserTabsEnabled = togglePermission(
		['tabs', 'tabGroups'],
		'browserTabsEnabled',
		'browser_tabs_enabled',
		'browser_tabs_disabled'
	)

	if (!isInitialized) {
		return null
	}
	const contextValue: GeneralSettingContextType = {
		blurMode: settings.blurMode,
		analyticsEnabled: settings.analyticsEnabled,
		selected_timezone:
			settings?.selected_timezone || DEFAULT_SETTINGS.selected_timezone,
		updateSetting,
		setAnalyticsEnabled,
		setTimezone,
		browserBookmarksEnabled: settings.browserBookmarksEnabled,
		setBrowserBookmarksEnabled,
		browserTabsEnabled: settings.browserTabsEnabled,
		setBrowserTabsEnabled,
	}

	return (
		<GeneralSettingContext.Provider value={contextValue}>
			{children}
		</GeneralSettingContext.Provider>
	)
}

export function useGeneralSetting() {
	const context = useContext(GeneralSettingContext)

	if (!context) {
		throw new Error('useGeneralSetting must be used within a GeneralSettingProvider')
	}

	return context
}
