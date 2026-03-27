import Modal from '@/components/modal'
import AuthForm from './auth-form/auth-form'
import { SettingModal } from '../../setting-modal'
interface FriendSettingModalProps {
	isOpen: boolean
	onClose: () => void
	selectedTab?: string | null
}
export const UserAccountModal = ({
	isOpen,
	onClose,
	selectedTab,
}: FriendSettingModalProps) => {
	
	if (!true)
		return (
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				size="md"
				title="ورود به حساب کاربری"
				direction="rtl"
			>
				<AuthForm />
			</Modal>
		)

	return (
		<SettingModal
			isOpen={isOpen}
			onClose={onClose}
			selectedTab={selectedTab as any}
		/>
	)
}
