import { IconLoading } from '@/components/loading/icon-loading'
import { useAuth } from '@/context/auth.context'
import { getMainClient } from '@/services/api'
import { useState } from 'react'
import { showToast } from '@/common/toast'
import Analytics from '@/analytics'
import { FaTelegramPlane } from 'react-icons/fa'

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
	const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
	let str = ''
	for (const b of arr) str += String.fromCharCode(b)
	return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function makePkce(): Promise<{ verifier: string; challenge: string }> {
	const verifier = base64Url(crypto.getRandomValues(new Uint8Array(32)))
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(verifier)
	)
	return { verifier, challenge: base64Url(digest) }
}

// Telegram OIDC login (authorization code + PKCE). Uses VITE_TELEGRAM_CLIENT_ID
// (from @BotFather -> Login Widget). The bot's "Redirect URIs" must include the
// extension redirect: https://<extension-id>.chromiumapp.org/telegram
export default function LoginTelegramButton() {
	const { login } = useAuth()
	const [isLoading, setIsLoading] = useState(false)
	const clientId = import.meta.env.VITE_TELEGRAM_CLIENT_ID as string | undefined

	const loginTelegram = async () => {
		Analytics.event('auth_method_changed_to_telegram')
		if (!clientId) {
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
			const { verifier, challenge } = await makePkce()
			const state = base64Url(crypto.getRandomValues(new Uint8Array(16)))

			const url = new URL('https://oauth.telegram.org/auth')
			url.searchParams.set('client_id', clientId)
			url.searchParams.set('redirect_uri', redirectUri)
			url.searchParams.set('response_type', 'code')
			url.searchParams.set('scope', 'openid profile')
			url.searchParams.set('state', state)
			url.searchParams.set('code_challenge', challenge)
			url.searchParams.set('code_challenge_method', 'S256')

			const redirectUrl = await browser.identity.launchWebAuthFlow({
				url: url.toString(),
				interactive: true,
			})
			if (!redirectUrl) {
				showToast('ورود با تلگرام ناموفق بود', 'error')
				return
			}

			const parsed = new URL(redirectUrl)
			const params = parsed.searchParams.has('code')
				? parsed.searchParams
				: new URLSearchParams(parsed.hash.replace(/^#/, ''))
			const code = params.get('code')
			if (!code || params.get('state') !== state) {
				showToast('ورود با تلگرام ناموفق بود', 'error')
				return
			}

			const client = await getMainClient()
			const { data } = await client.post('/auth/telegram', {
				code,
				redirect_uri: redirectUri,
				code_verifier: verifier,
			})
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
