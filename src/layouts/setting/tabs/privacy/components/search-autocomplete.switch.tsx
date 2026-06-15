import { autoFormatErrorToast } from '@/common/toast'
import { ToggleSwitch } from '@/components/toggle-switch.component'
import { useAuth } from '@/context/auth.context'
import { useLanguage } from '@/context/language.context'
import { safeAwait } from '@/services/api'
import { useUpdateSearchAutocomplete } from '@/services/hooks/extension/updateSetting.hook'

export function SearchAutocompleteSwitch() {
	const { t } = useLanguage()
	const { isAuthenticated, user } = useAuth()
	const { mutateAsync, isPending } = useUpdateSearchAutocomplete()

	const onToggle = async () => {
		const [er, _] = await safeAwait(
			mutateAsync({ isActive: !user?.searchAutocompleteEnabled })
		)
		if (er) {
			autoFormatErrorToast(er)
		}
	}

	return (
		<div className="flex items-center justify-between">
			<div className="flex-1 space-y-2">
				<h3 className="font-medium text-content">
					{t('settings.privacy.searchSuggestions.title')}
				</h3>
				<p className="text-sm font-light leading-relaxed text-muted">
					{t('settings.privacy.searchSuggestions.description')}
				</p>
			</div>
			<div className="flex-shrink-0 ms-4">
				<ToggleSwitch
					enabled={user?.searchAutocompleteEnabled || false}
					onToggle={onToggle}
					disabled={!isAuthenticated || isPending}
					loading={isPending}
				/>
			</div>
		</div>
	)
}
