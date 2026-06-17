import { IconLoading } from '@/components/loading/icon-loading'
import { useAuth } from '@/context/auth.context'
import { getMainClient } from '@/services/api'
import { useState } from 'react'
import { showToast } from '@/common/toast'
import Analytics from '@/analytics'
import { FaTelegramPlane } from 'react-icons/fa'

// Telegram Login Widget via the extension's web-auth flow (mirrors Google).
// Requires VITE_TELEGRAM_BOT_ID (numeric bot id from @BotFather) and the bot's
// domain set to the extension redirect domain (<id>.chromiumapp.org).
export default function LoginTelegramButton() {
	const { login } = useAuth()
	const [isLoading, setIsLoading] = useState(false)
	const botId = import.meta.env.VITE_TELEGRAM_BOT_ID as string | undefined

	const loginTelegram = async () => {
		Analytics.event('auth_method_changed_to_telegram')
		if (!botId) {
			showToast('ورود با تلگرام پیکربندی نشده است', 'error')
			return
		}
		setIsLoading(true)
		try {
			if (!(await browser.permissions.contains({ permissions: ['identity'] }))) {
				const granted = await browser.permissions.request({
					permissions: ['identity'],
				})
				if (!granted) return
			}

			const redirectUri = browser.identity.getRedirectURL('telegram')
			const url = new URL('https://oauth.telegram.org/auth')
			url.searchParams.set('bot_id', botId)
			url.searchParams.set('origin', new URL(redirectUri).origin)
			url.searchParams.set('return_to', redirectUri)
			url.searchParams.set('request_access', 'write')

			const redirectUrl = await browser.identity.launchWebAuthFlow({
				url: url.toString(),
				interactive: true,
			})

			const fragment = redirectUrl?.split('#')[1] ?? ''
			const tgAuthResult = new URLSearchParams(fragment).get('tgAuthResult')
			if (!tgAuthResult) {
				showToast('ورود با تلگرام ناموفق بود', 'error')
				return
			}

			const padded = tgAuthResult.replace(/-/g, '+').replace(/_/g, '/')
			// decode base64 -> UTF-8 JSON (names may contain unicode)
			const authData = JSON.parse(decodeURIComponent(escape(atob(padded))))

			const client = await getMainClient()
			const { data } = await client.post('/auth/telegram', authData)
			if (data?.token) {
				login(data.token)
			} else {
				showToast('ورود با تلگرام ناموفق بود', 'error')
			}
		} catch {
			showToast('ورود با تلگرام ناموفق بود', 'error')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<button
			type="button"
			onClick={loginTelegram}
			disabled={isLoading}
			className="group px-4 md:px-8 py-2.5 md:py-3 rounded-2xl text-sm md:text-base font-medium shadow-md hover:shadow-lg w-full flex items-center justify-center border-2 border-content bg-content hover:bg-base-200 transition-all duration-200 gap-1.5 md:gap-2 cursor-pointer active:scale-95"
		>
			<div className="relative flex items-center justify-center flex-shrink-0 text-[#229ED9]">
				{isLoading ? (
					<IconLoading className="!h-4 !w-4 md:!h-5 md:!w-5" />
				) : (
					<FaTelegramPlane className="w-4 h-4 transition-all duration-200 md:w-5 md:h-5 group-hover:scale-110" />
				)}
			</div>
			<span className="transition-all duration-200 group-hover:scale-105 whitespace-nowrap text-base-content/80 group-hover:text-base-content">
				{isLoading ? 'درحال پردازش...' : 'ورود با تلگرام'}
			</span>
		</button>
	)
}
