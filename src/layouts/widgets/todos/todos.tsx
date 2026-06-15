import { useState } from 'react'
import { FiList } from 'react-icons/fi'
import { ExpandableTodoInput } from './expandable-todo-input'
import { useAuth } from '@/context/auth.context'
import Analytics from '@/analytics'
import { IconLoading } from '@/components/loading/icon-loading'
import { FilterTooltip } from '@/components/filter-tooltip'
import { FaSortAmountDown, FaTags } from 'react-icons/fa'
import { useGetTags } from '@/services/hooks/todo/get-tags.hook'
import type { Todo } from '@/services/hooks/todo/todo.interface'
import { getFromStorage, setToStorage } from '@/common/storage'
import { MdOutlineFilterList, MdOutlineFilterListOff, MdRefresh } from 'react-icons/md'
import { useGeneralSetting } from '@/context/general-setting.context'
import { Button } from '@/components/button/button'
import Tooltip from '@/components/toolTip'
import { useGetTodos } from '@/services/hooks/todo/get-todos.hook'
import { TodoItem } from './todo.item'
import { useLanguage } from '@/context/language.context'

const TagList = ['', '-all-']

export function TodosLayout() {
	const { isAuthenticated } = useAuth()
	const { blurMode } = useGeneralSetting()
	const { t } = useLanguage()
	const filterOptions = [
		{ value: 'all', label: t('widgets.todos.filterAll') },
		{ value: 'today', label: t('widgets.todos.filterToday') },
		{ value: 'thisMonth', label: t('widgets.todos.filterThisMonth') },
		{ value: 'done', label: t('widgets.todos.filterDone') },
		{ value: 'pending', label: t('widgets.todos.filterPending') },
	]
	const sortOptions = [
		{ value: 'def', label: t('widgets.todos.sortDefault') },
		{ value: 'high', label: t('widgets.todos.sortHigh') },
		{ value: 'medium', label: t('widgets.todos.sortMedium') },
		{ value: 'low', label: t('widgets.todos.sortLow') },
	]
	const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
	const [dateFilter, setDateFilter] = useState<string>('all')
	const [sort, setSort] = useState<string>('def')
	const [tagFilter, setTagFilter] = useState<string>('')

	const observerRef = useRef<IntersectionObserver | null>(null)
	const loadMoreRef = useRef<HTMLDivElement | null>(null)

	const getServerFilters = () => {
		const filters: any = {
			limit: 5,
		}

		if (dateFilter === 'today') {
			filters.dateFilter = 'today'
		} else if (dateFilter === 'this_month') {
			filters.dateFilter = 'this_month'
		} else if (dateFilter === 'done') {
			filters.isCompleted = true
		} else if (dateFilter === 'pending') {
			filters.isCompleted = false
		}

		if (tagFilter && tagFilter !== '-all-') {
			filters.category = tagFilter
		}

		return filters
	}

	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
		useGetTodos(isAuthenticated, getServerFilters())
	const { data: fetchedTags } = useGetTags(isAuthenticated)

	const allTodos = data?.pages.flatMap((page) => page.todos) || []

	const sortedTodos = [...allTodos].sort((a, b) => {
		switch (sort) {
			case 'def':
				return a.order - b.order
			case 'pending-first':
				if (a.completed === b.completed) return a.order - b.order
				return a.completed ? 1 : -1
			case 'done-first':
				if (a.completed === b.completed) return a.order - b.order
				return a.completed ? -1 : 1
			case 'high':
				return b.priority === 'high' ? 1 : a.priority === 'high' ? -1 : 0
			case 'medium':
				return b.priority === 'medium' ? 1 : a.priority === 'medium' ? -1 : 0
			case 'low':
				return b.priority === 'low' ? 1 : a.priority === 'low' ? -1 : 0
			default:
				return a.order - b.order
		}
	})

	useEffect(() => {
		if (observerRef.current) {
			observerRef.current.disconnect()
		}

		observerRef.current = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
					fetchNextPage()
				}
			},
			{ threshold: 0.1 }
		)

		if (loadMoreRef.current) {
			observerRef.current.observe(loadMoreRef.current)
		}

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect()
			}
		}
	}, [hasNextPage, isFetchingNextPage, fetchNextPage])

	const handleCloseTodoEditor = () => {
		setEditingTodo(null)
		Analytics.event('todo_edit_close')
	}

	const onDateFilterChange = (value: string) => {
		setDateFilter(value)
		Analytics.event(`todo_select_date_${value}_filter`)
		setToStorage('todoFilter', value)
	}

	const onSortChange = (value: string) => {
		setSort(value)
		Analytics.event(`todo_select_sort_${value}`)
		setToStorage('todoSort', value)
	}

	const onTagFilterChange = (value: string) => {
		setTagFilter(value)
		Analytics.event(`todo_tag_change`)
	}

	useEffect(() => {
		async function load() {
			const [todoFilter, todoSort] = await Promise.all([
				getFromStorage('todoFilter'),
				getFromStorage('todoSort'),
			])
			if (todoFilter) setDateFilter(todoFilter)
			if (todoSort) setSort(todoSort)
		}

		load()
	}, [])

	const tagFilterOptions =
		fetchedTags
			?.filter((t) => t)
			?.map((t) => ({
				label: t,
				value: t,
			})) || []
	if (tagFilterOptions.length) {
		tagFilterOptions.unshift({
			label: t('widgets.todos.filterAll'),
			value: '-all-',
		})
	}

	const openEditTodo = (todo: Todo) => {
		setEditingTodo(todo)
		Analytics.event('todo_edit_open')
	}

	const onRefresh = () => {
		refetch()
		Analytics.event(`todo_refetch`)
	}

	return (
		<>
			<div className="flex-none">
				<div className="flex justify-between my-1">
					<div className="flex gap-0.5">
						<div className="flex flex-row items-center gap-1">
							<FilterTooltip
								options={filterOptions}
								value={dateFilter}
								icon={
									dateFilter !== 'all' ? (
										<MdOutlineFilterList
											size={10}
											className="text-primary"
										/>
									) : (
										<MdOutlineFilterListOff
											size={10}
											className="text-muted"
										/>
									)
								}
								onChange={onDateFilterChange}
								placeholder={t('widgets.todos.phFilter')}
								buttonClassName={`truncate gap-1.5`}
							/>
							<FilterTooltip
								icon={
									<FaTags
										size={10}
										className={
											TagList.includes(tagFilter)
												? 'text-muted'
												: 'text-primary!'
										}
									/>
								}
								options={tagFilterOptions}
								value={tagFilter || '-all-'}
								onChange={onTagFilterChange}
								placeholder={t('widgets.todos.phCategory')}
							/>
							<FilterTooltip
								icon={
									<FaSortAmountDown
										size={10}
										className={
											sort !== 'def'
												? 'text-primary!'
												: 'text-muted'
										}
									/>
								}
								options={sortOptions}
								value={sort}
								onChange={onSortChange}
								placeholder={t('widgets.todos.phSort')}
								buttonClassName="truncate gap-2"
							/>
						</div>
					</div>
					<div className="flex items-center gap-1">
						{isLoading ? <IconLoading /> : null}
						<Tooltip content={t('widgets.todos.reload')}>
							<Button
								size="sm"
								className={`px-2 py-0! border-none! rounded-xl text-base-content/40 shrink-0 active:scale-95 h-7!`}
								onClick={onRefresh}
							>
								<MdRefresh
									className={`text-content opacity-50 hover:opacity-100 ${isLoading ? 'animate-spin' : ''}`}
								/>
							</Button>
						</Tooltip>
					</div>
				</div>
			</div>
			<div className="mt-0.5 grow overflow-hidden">
				<div
					className={`space-y-1.5 overflow-y-auto scrollbar-none h-full ${blurMode ? 'blur-mode' : 'disabled-blur-mode'}`}
				>
					{isLoading ? (
						<div className="flex flex-col gap-1">
							{[...Array(5)].map((_, i) => (
								<TodoSkeleton key={i} />
							))}
						</div>
					) : sortedTodos.length === 0 ? (
						<TodosEmpty />
					) : (
						<div className="flex flex-col gap-0">
							{sortedTodos.map((todo) => (
								<TodoItem
									blurMode={blurMode}
									key={todo.id}
									todo={todo}
									onUpdated={() => refetch()}
									onEdit={(t: any) => openEditTodo(t)}
								/>
							))}

							{hasNextPage && (
								<div ref={loadMoreRef} className="">
									{isFetchingNextPage && (
										<div className="flex flex-col gap-1">
											{[...Array(3)].map((_, i) => (
												<TodoSkeleton key={i} />
											))}
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
			{
				<ExpandableTodoInput
					editTodo={editingTodo as any}
					onClose={() => handleCloseTodoEditor()}
					isEdit={!!editingTodo}
					onUpdated={refetch}
				/>
			}
		</>
	)
}

function TodosEmpty() {
	const { t } = useLanguage()
	return (
		<div
			className={
				'flex-1 flex flex-col items-center justify-center gap-y-1.5 px-5 py-8'
			}
		>
			<div
				className={
					'flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-base-300/70 border-base/70'
				}
			>
				<FiList className="text-content" size={24} />
			</div>
			<p className="mt-1 font-bold text-center text-content">
				{t('widgets.todos.empty')}
			</p>
			<p className="text-center text-[.65rem] text-content opacity-75">
				{t('widgets.todos.emptyHint')}
			</p>
		</div>
	)
}

export function TodoSkeleton() {
	return (
		<div className="flex flex-row justify-between gap-1 p-1 overflow-hidden border rounded-lg shadow-sm border-content bg-glass bg-base-300/30">
			<div className="flex items-center gap-1">
				<div className="w-5 h-5 rounded-md skeleton shrink-0"></div>
				<div className="w-32 h-5 skeleton"></div>
			</div>
			<div className="w-5 h-5 rounded-md skeleton shrink-0"></div>
		</div>
	)
}
