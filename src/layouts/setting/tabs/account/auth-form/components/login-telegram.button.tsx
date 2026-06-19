import { IconLoading } from '@/components/loading/icon-loading'
import { useAuth } from '@/context/auth.context'
import { useLanguage } from '@/context/language.context'
import { getMainClient } from '@/services/api'
import { useState } from 'react'
import { showToast } from '@/common/toast'
import Analytics from '@/analytics'
import { FaTelegramPlane } from 'react-icons/fa'

const API_URL = (import.meta.env.VITE_API as string) || 'https://tab.frix.me'

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Telegram OIDC login. Telegram's authorization page is a polling widget that
// only works in a first-party browser context, so chrome.identity.launchWebAuthFlow
// (an isolated, storage-partitioned window) fails with "Authorization page could
// not be loaded". Instead we open the authorize URL in a NORMAL popup window with
// the redirect pointing at our backend callback (PUBLIC_URL/auth/telegram/callback),
// then poll /auth/telegram/result for the session token.
//
// Requires VITE_TELEGRAM_CLIENT_ID (from @BotFather → Login Widget) and the backend
// callback URL registered under the bot's "Redirect URIs".
export default function LoginTelegramButton() {
	const { login } = useAuth()
	const { t } = useLanguage()
	const [isLoading, setIsLoading] = useState(false)
	const clientId = import.meta.env.VITE_TELEGRAM_CLIENT_ID as string | undefined

	const loginTelegram = async () => {
		Analytics.event('auth_method_changed_to_telegram')
		if (!clientId) {
			showToast(t('auth.telegramNotConfigured'), 'error')
			return
		}
		setIsLoading(true)
		let popupId: number | undefined
		try {
			const { verifier, challenge } = await makePkce()
			const state = base64Url(crypto.getRandomValues(new Uint8Array(24)))
			const redirectUri = `${API_URL}/auth/telegram/callback`

			// Register state + PKCE verifier server-side before opening the popup.
			const client = await getMainClient()
			await client.post('/auth/telegram/start', {
				state,
				code_verifier: verifier,
			})

			const url = new URL('https://oauth.telegram.org/auth')
			url.searchParams.set('client_id', clientId)
			url.searchParams.set('redirect_uri', redirectUri)
			url.searchParams.set('response_type', 'code')
			url.searchParams.set('scope', 'openid profile')
			url.searchParams.set('state', state)
			url.searchParams.set('code_challenge', challenge)
			url.searchParams.set('code_challenge_method', 'S256')

			// Normal popup window = first-party context (works), unlike launchWebAuthFlow.
			const win = await browser.windows.create({
				url: url.toString(),
				type: 'popup',
				width: 520,
				height: 720,
			})
			popupId = win?.id

			// Poll for the result (~2 min), then give up.
			const deadline = Date.now() + 120_000
			let loggedIn = false
			while (Date.now() < deadline) {
				await sleep(1500)
				let data: { token?: string; error?: string; pending?: boolean } = {}
				try {
					const res = await client.get('/auth/telegram/result', {
						params: { state },
					})
					data = res.data ?? {}
				} catch {
					continue // transient network error — keep polling
				}
				if (data.token) {
					loggedIn = true
					login(data.token)
					break
				}
				if (data.error) {
					console.error('[telegram-login] backend error', data.error)
					showToast(t('auth.telegramError', { detail: data.error }), 'error')
					break
				}
				// pending → keep polling
			}

			if (popupId !== undefined) {
				try {
					await browser.windows.remove(popupId)
				} catch {
					/* user may have already closed it */
				}
			}
			if (!loggedIn) {
				// Only show the timeout toast if no error/success toast already fired.
				const res = await client
					.get('/auth/telegram/result', { params: { state } })
					.catch(() => null)
				if (!res?.data?.error) {
					showToast(t('auth.telegramTimedOut'), 'error')
				}
			}
		} catch (e) {
			const res = (e as { response?: { data?: { error?: string; detail?: string } } })
				?.response
			const detail = res?.data?.detail ?? res?.data?.error
			console.error('[telegram-login] failed', res?.data ?? e)
			showToast(
				detail ? t('auth.telegramError', { detail }) : t('auth.telegramFailed'),
				'error'
			)
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
				{isLoading ? t('auth.processing') : t('auth.telegram')}
			</span>
		</button>
	)
}
