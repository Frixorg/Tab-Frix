import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react'
import Analytics from '@/analytics'
import { getFromStorage, setToStorage } from '@/common/storage'
import CalendarLayout from '@/layouts/widgets/calendar/calendar'
import { ComboWidget } from '@/layouts/widgets/comboWidget/combo-widget.layout'
import { NetworkLayout } from '@/layouts/widgets/network/network.layout'
import { NewsLayout } from '@/layouts/widgets/news/news.layout'
import { ToolsLayout } from '@/layouts/widgets/tools/tools.layout'
import { WeatherLayout } from '@/layouts/widgets/weather/weather.layout'
import { WigiArzLayout } from '@/layouts/widgets/wigiArz/wigi_arz.layout'
import { YouTubeLayout } from '@/layouts/widgets/youtube/youtube.layout'
import { CurrencyProvider } from './currency.context'
import { showToast } from '@/common/toast'
import { YadkarWidget } from '@/layouts/widgets/yadkar/yadkar'
import { TodoProvider } from './todo.context'
import { BookmarksList } from '@/layouts/bookmark/bookmarks'
import { SearchLayout } from '@/layouts/search/search'
import { TimeAndDateLayout } from '@/layouts/widgets/timeAndDate/TimeandDateWidget.layout'
import { BookmarkProvider } from '@/layouts/bookmark/context/bookmark.context'

export enum WidgetKeys {
	comboWidget = 'comboWidget',
	arzLive = 'arzLive',
	news = 'news',
	calendar = 'calendar',
	weather = 'weather',
	todos = 'todos',
	tools = 'tools',
	notes = 'notes',
	youtube = 'youtube',
	TimeandDate = 'TimeandDate',
	network = 'network',
	yadKar = 'yadKar',
	searchAndBookmarks = 'searchAndBookmarks',
}
export interface WidgetItem {
	id: WidgetKeys
	emoji: string
	label: string
	node: any
	order: number
	gridSpan?: string
	canToggle?: boolean
	isNew?: boolean
	disabled?: boolean
	soon?: boolean
	popular?: boolean
}

export const widgetItems: WidgetItem[] = [
	{
		id: WidgetKeys.searchAndBookmarks,
		emoji: '🔍',
		label: 'Search & Bookmarks',
		order: -2,
		gridSpan: 'md:col-span-2',
		node: (
			<div className="space-y-2">
				<SearchLayout />
				<BookmarkProvider>
					<BookmarksList />
				</BookmarkProvider>
			</div>
		),
		canToggle: false,
	},
	{
		id: WidgetKeys.TimeandDate,
		emoji: '🕑',
		label: 'Time and Date',
		order: -1,
		node: <TimeAndDateLayout />,
		canToggle: true,
	},
	{
		id: WidgetKeys.calendar,
		emoji: '📅',
		label: 'Calendar',
		order: 0,
		node: <CalendarLayout />,
		canToggle: true,
		popular: true,
	},
	{
		id: WidgetKeys.yadKar,
		emoji: '📒',
		label: 'Todo & Notes',
		order: 0,
		node: (
			<TodoProvider>
				<YadkarWidget />
			</TodoProvider>
		),
		canToggle: true,
		isNew: true,
	},
	{
		id: WidgetKeys.tools,
		emoji: '⌛',
		label: 'Pomodoro Timer',
		order: 1,
		node: <ToolsLayout />,
		canToggle: true,
	},

	{
		id: WidgetKeys.weather,
		emoji: '🌤️',
		label: 'Weather',
		order: 3,
		node: <WeatherLayout />,
		canToggle: true,
	},
	{
		id: WidgetKeys.comboWidget,
		emoji: '💲',
		label: 'Currency & News',
		order: 4,
		node: (
			<CurrencyProvider>
				<ComboWidget />
			</CurrencyProvider>
		),
		canToggle: true,
		popular: true,
	},
	// {
	// 	id: WidgetKeys.arzLive,
	// 	emoji: '💰',
	// 	label: 'ویجی ارز',
	// 	order: 5,
	// 	node: (
	// 		<CurrencyProvider>
	// 			<WigiArzLayout inComboWidget={false} />
	// 		</CurrencyProvider>
	// 	),
	// 	canToggle: true,
	// },
	// {
	// 	id: WidgetKeys.news,
	// 	emoji: '📰',
	// 	label: 'ویجی نیوز',
	// 	order: 6,
	// 	node: <NewsLayout inComboWidget={false} />,
	// 	canToggle: true,
	// },

	// {
	// 	id: WidgetKeys.network,
	// 	emoji: '🌐',
	// 	label: 'شبکه',
	// 	order: 9,
	// 	node: <NetworkLayout inComboWidget={false} enableBackground={true} />,
	// 	canToggle: true,
	// 	isNew: false,
	// },
	// {
	// 	id: WidgetKeys.youtube,
	// 	emoji: '📺',
	// 	label: 'آمار یوتیوب',
	// 	order: 8,
	// 	node: <YouTubeLayout />,
	// 	canToggle: false,
	// 	disabled: true,
	// 	soon: true,
	// },
]

interface WidgetVisibilityContextType {
	visibility: WidgetKeys[]
	toggleWidget: (widgetId: WidgetKeys) => void
	reorderWidgets: (sourceIndex: number, destinationIndex: number) => void
	getSortedWidgets: () => WidgetItem[]
}

const defaultVisibility: WidgetKeys[] = [
	WidgetKeys.searchAndBookmarks,
	WidgetKeys.TimeandDate,
	WidgetKeys.calendar,
	WidgetKeys.tools,
	WidgetKeys.yadKar,
	WidgetKeys.comboWidget,
]
export const MAX_VISIBLE_WIDGETS = 8

const WidgetVisibilityContext = createContext<WidgetVisibilityContextType | undefined>(
	undefined
)

const getDefaultWidgetOrders = (): Record<WidgetKeys, number> => {
	const orders: Record<WidgetKeys, number> = {} as Record<WidgetKeys, number>
	for (const item of widgetItems) {
		orders[item.id] = item.order
	}
	return orders
}

export function WidgetVisibilityProvider({ children }: { children: ReactNode }) {
	const [visibility, setVisibility] = useState<WidgetKeys[]>([])
	const [widgetOrders, setWidgetOrders] =
		useState<Record<WidgetKeys, number>>(getDefaultWidgetOrders)
	const firstRender = useRef(true)

	const saveActiveWidgets = () => {
		const activeWidgets = widgetItems
			.filter((item) => visibility.includes(item.id))
			.map((item) => ({
				...item,
				order: widgetOrders[item.id] ?? item.order,
			}))
		setToStorage('activeWidgets', activeWidgets)
	}

	useEffect(() => {
		async function loadSettings() {
			const storedVisibility = await getFromStorage('activeWidgets')
			if (storedVisibility) {
				const visibilityIds = storedVisibility
					.filter((item) => widgetItems.some((w) => w.id === item.id))
					.map((item: any) => item.id as WidgetKeys)

				if (
					visibilityIds.includes(WidgetKeys.todos) ||
					visibilityIds.includes(WidgetKeys.notes)
				) {
					Analytics.event('yadkar_merged')

					visibilityIds.splice(visibilityIds.indexOf(WidgetKeys.todos), 1)
					visibilityIds.splice(visibilityIds.indexOf(WidgetKeys.notes), 1)

					visibilityIds.push(WidgetKeys.yadKar)
					saveActiveWidgets()
				}

				setVisibility(visibilityIds)

				const orders: Record<WidgetKeys, number> = {} as Record<
					WidgetKeys,
					number
				>
				for (const item of storedVisibility) {
					orders[item.id as WidgetKeys] =
						item.order ?? getDefaultWidgetOrders()[item.id as WidgetKeys]
				}
				setWidgetOrders(orders)
			} else {
				setVisibility(defaultVisibility)
				setWidgetOrders(getDefaultWidgetOrders())
			}
			firstRender.current = false
		}

		loadSettings()
	}, [])

	useEffect(() => {
		if (!firstRender.current) {
			saveActiveWidgets()
		}
	}, [visibility, widgetOrders])

	const toggleWidget = (widgetId: WidgetKeys) => {
		setVisibility((prev) => {
			const isCurrentlyVisible = prev.includes(widgetId)

			if (!isCurrentlyVisible) {
				// Auth removed: no guest widget limit
			}

			const newVisibility = isCurrentlyVisible
				? prev.filter((id) => id !== widgetId)
				: [...prev, widgetId]

			if (isCurrentlyVisible) {
				Analytics.event(`widget_remove_${widgetId}`)
			} else {
				Analytics.event(`widget_add_${widgetId}`)
			}
			return newVisibility
		})
	}

	const reorderWidgets = (sourceIndex: number, destinationIndex: number) => {
		const visibleWidgets = getSortedWidgets()

		if (sourceIndex === destinationIndex) return

		setWidgetOrders((prev) => {
			const newOrders = { ...prev }
			const draggedWidget = visibleWidgets[sourceIndex]
			if (!draggedWidget) {
				return prev
			}

			const safeDestination = Math.max(0, destinationIndex)
			const otherWidgets = visibleWidgets.filter(
				(widget) => widget.id !== draggedWidget.id
			)

			newOrders[draggedWidget.id] = safeDestination

			let nextSlot = 0
			for (const widget of otherWidgets) {
				if (nextSlot === safeDestination) {
					nextSlot += 1
				}

				const preferredSlot = Math.max(0, widget.order ?? 0)
				const assignedSlot = Math.max(nextSlot, preferredSlot)

				if (assignedSlot === safeDestination) {
					newOrders[widget.id] = assignedSlot + 1
					nextSlot = assignedSlot + 2
				} else {
					newOrders[widget.id] = assignedSlot
					nextSlot = assignedSlot + 1
				}
			}

			return newOrders
		})
	}

	const getSortedWidgets = (): WidgetItem[] => {
		return widgetItems
			.filter((item) => visibility.includes(item.id))
			.map((item) => ({
				...item,
				order: widgetOrders[item.id] ?? item.order,
			}))
			.sort((a, b) => a.order - b.order)
	}
	return (
		<WidgetVisibilityContext.Provider
			value={{
				visibility,
				toggleWidget,

				reorderWidgets,
				getSortedWidgets,
			}}
		>
			{children}
		</WidgetVisibilityContext.Provider>
	)
}

export const useWidgetVisibility = () => {
	const context = useContext(WidgetVisibilityContext)
	if (context === undefined) {
		throw new Error(
			'useWidgetVisibility must be used within a WidgetVisibilityProvider'
		)
	}
	return context
}
