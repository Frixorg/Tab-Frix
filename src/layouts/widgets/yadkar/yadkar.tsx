import { useState } from 'react'
import { callEvent } from '@/common/utils/call-event'
import { FaCog } from 'react-icons/fa'
import { Button } from '@/components/button/button'
import { WidgetTabKeys } from '@/layouts/widgets-settings/constant/tab-keys'
import Analytics from '@/analytics'
import { NotesLayout } from '../notes/notes.layout'
import { TodosLayout } from '../todos/todos'
import { TabNavigation } from '@/components/tab-navigation'
import { HiOutlineCheckCircle, HiOutlineDocumentText } from 'react-icons/hi2'
import { WidgetContainer } from '../widget-container'

export function YadkarWidget() {
	const [tab, setTab] = useState<'todos' | 'notes'>('todos')

	const onChangeTab = (newTab: 'todos' | 'notes') => {
		setTab(newTab)
		Analytics.event('yadkar_change_tab')
	}

	const onClickSettings = () => {
		callEvent('openWidgetsSettings', { tab: WidgetTabKeys.widget_management })
	}

	return (
		<WidgetContainer className="relative group">
			<div className="absolute inset-0 z-20">
				<Button
					onClick={onClickSettings}
					size="xs"
					className="m-1.5 h-5 w-5 p-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 !border-none !shadow-none transition-all duration-300 delay-200"
				>
					<FaCog size={12} className="text-content" />
				</Button>
			</div>
			<div className="flex flex-col h-full">
				<div className="flex-none">
					<div className="flex flex-col">
						<TabNavigation
							tabMode="advanced"
							activeTab={tab}
							onTabClick={onChangeTab}
							tabs={[
								{
									id: 'todos',
									label: 'وظایف',
									icon: <HiOutlineCheckCircle size={14} />,
								},
								{
									id: 'notes',
									label: 'یادداشت',
									icon: <HiOutlineDocumentText size={14} />,
								},
							]}
							size="small"
							className="w-full"
						/>
					</div>
				</div>

				{tab === 'todos' ? <TodosLayout /> : <NotesLayout />}
			</div>
		</WidgetContainer>
	)
}
