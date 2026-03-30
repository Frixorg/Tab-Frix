import { usePetContext } from './pet.context'
import { PetFactory } from './pet-factory'
import { callEvent } from '@/common/utils/call-event'
import { FaCog } from 'react-icons/fa'
import { Button } from '@/components/button/button'
import { WidgetTabKeys } from '@/layouts/widgets-settings/constant/tab-keys'

export function Pet() {
	const { isEnabled } = usePetContext()

	if (!isEnabled) return null

	const onClickSettings = () => {
		callEvent('openWidgetsSettings', { tab: WidgetTabKeys.Pet })
	}

	return (
		<div className="relative group">
			<div className="absolute inset-0 z-20">
				<Button
					onClick={onClickSettings}
					size="xs"
					className="m-1.5 h-5 w-5 p-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 !border-none !shadow-none transition-all duration-300 delay-200"
				>
					<FaCog size={12} className="text-content" />
				</Button>
			</div>
			<PetFactory />
		</div>
	)
}
