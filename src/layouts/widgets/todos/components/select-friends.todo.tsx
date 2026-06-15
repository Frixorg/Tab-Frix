import { callEvent } from '@/common/utils/call-event'
import { Button } from '@/components/button/button'
import { Dropdown } from '@/components/dropdown'
import { SelectFriendLayout } from '@/layouts/friends/components/select-friend.layout'
import type { Friend } from '@/services/hooks/friends/friendService.hook'
import { FiUserPlus } from 'react-icons/fi'
import { useLanguage } from '@/context/language.context'

interface Prop {
	selectedFriends: Friend[]
	setSelectedFriends: any
}
export function TodoSelectFriends({ selectedFriends, setSelectedFriends }: Prop) {
	const { t } = useLanguage()
	return (
		<Dropdown
			trigger={
				<Button
					type="button"
					size="sm"
					className="p-2 border rounded-xl  text-[10px]  text-muted shrink-0 active:scale-95"
				>
					{selectedFriends.length > 0 ? (
						<div className="flex gap-0.5 text-base-content/40">
							{selectedFriends.length}
							<p>{t('widgets.todos.friend')}</p>
						</div>
					) : (
						<div className="flex gap-0.5 text-base-content/40">
							<FiUserPlus size={16} className="text-base-content/40" />
							{t('widgets.todos.friends')}
						</div>
					)}
				</Button>
			}
			dropdownClassName="select-friends"
			position="top-right"
		>
			<div className="p-2 min-w-xs min-h-80 max-h-80">
				<p className="pr-1 mb-1 text-sm font-bold">{t('widgets.todos.addFriend')}</p>
				<div className="h-56 max-h-56">
					<SelectFriendLayout
						onChange={(f) => setSelectedFriends([...f])}
						title={t('widgets.todos.addFriend')}
						selectedFriendIds={selectedFriends?.map((f: any) => f.id) || []}
					/>
				</div>
				<Button
					size="sm"
					onClick={() => callEvent('closeAllDropdowns')}
					className="w-full  border-none! mt-2.5 border! border-content! rounded-t-xl text-base-content/80"
				>
					{t('widgets.todos.saveClose')}
				</Button>
			</div>
		</Dropdown>
	)
}
