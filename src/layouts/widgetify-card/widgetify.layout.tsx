import { WidgetContainer } from '../widgets/widget-container'
import { NotificationCenter } from './notification-center/notification-center'
import { Pet } from './pets/pet'
import { PetProvider } from './pets/pet.context'

export const WidgetifyLayout = () => {
	return (
		<WidgetContainer className="overflow-hidden flex flex-col !p-2">
			<div className="relative w-full flex-1 min-h-0">
				{
					<PetProvider>
						<Pet />
					</PetProvider>
				}

				<div className="relative z-10 flex flex-col items-center gap-2 overflow-y-auto h-full min-h-0 small-scrollbar">
					<div
						className={`flex flex-col flex-1 w-full gap-1 overflow-y-auto scrollbar-none pb-2`}
					>
						<NotificationCenter />
					</div>
				</div>
			</div>
		</WidgetContainer>
	)
}
