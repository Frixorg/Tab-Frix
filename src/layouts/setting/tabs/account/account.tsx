import { AnimatePresence, motion } from 'framer-motion'
import AuthForm from './auth-form/auth-form'
import { UserProfile } from './tabs/user-profile/user-profile'

export const AccountTab = () => {
	
	return (
		<div className="w-full h-full max-w-xl mx-auto">
			<AnimatePresence mode="wait">
				<motion.div
					key="auth"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: -10 }}
					transition={{ duration: 0.3 }}
					className="h-full"
				>
					<AuthForm />
				</motion.div>
			</AnimatePresence>
		</div>
	)
}
