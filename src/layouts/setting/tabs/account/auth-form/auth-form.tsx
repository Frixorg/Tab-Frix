import LoginGoogleButton from './components/login-google.button'
import LoginTelegramButton from './components/login-telegram.button'

// Login is limited to Google and Telegram. Email/phone (OTP) and password
// sign-in have been removed.
const AuthForm = () => {
	return (
		<div className="flex flex-col w-full max-w-lg px-2 mx-auto md:px-0">
			<div className="p-4 my-2 border shadow-md md:p-6 border-content bg-content rounded-xl md:rounded-2xl backdrop-blur-sm">
				<div className="flex flex-col items-stretch gap-3">
					<LoginGoogleButton />
					<LoginTelegramButton />
				</div>
			</div>
		</div>
	)
}

export default AuthForm
