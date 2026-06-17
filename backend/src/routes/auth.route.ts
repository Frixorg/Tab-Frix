import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { config } from '../config'
import { signJwt, telegramLogin } from '../auth/telegram'
import {
	completeLogin,
	failLogin,
	getVerifier,
	startLogin,
	takeResult,
} from '../auth/pending'

interface StartBody {
	state?: string
	code_verifier?: string
}
interface CallbackQuery {
	code?: string
	state?: string
	error?: string
	error_description?: string
}
interface ResultQuery {
	state?: string
}

function isConfigured(): boolean {
	return Boolean(
		config.telegramClientId && config.telegramClientSecret && config.authJwtSecret
	)
}

// Minimal self-closing HTML page shown inside the login popup window.
function htmlPage(title: string, message: string): string {
	const esc = (s: string) =>
		s.replace(/[&<>"]/g, (c) =>
			c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;'
		)
	return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(
		title
	)}</title><style>html,body{height:100%}body{font-family:Tahoma,Segoe UI,Arial,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;margin:0}.card{text-align:center;padding:32px 28px;border-radius:16px;background:#1e293b;max-width:360px;box-shadow:0 10px 40px rgba(0,0,0,.4)}h1{font-size:18px;margin:0 0 10px}p{font-size:14px;line-height:1.7;color:#94a3b8;margin:0}</style></head><body><div class="card"><h1>${esc(
		title
	)}</h1><p>${esc(
		message
	)}</p></div><script>setTimeout(function(){try{window.close()}catch(e){}},2500)</script></body></html>`
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
	// 1) POST /auth/telegram/start — the extension registers its random `state`
	//    (and PKCE verifier) just before opening the Telegram login popup. The
	//    verifier is kept server-side so the callback can finish the exchange.
	app.post(
		'/auth/telegram/start',
		async (req: FastifyRequest<{ Body: StartBody }>, reply: FastifyReply) => {
			if (!isConfigured()) {
				reply.code(501)
				return { error: 'telegram auth is not configured on this server' }
			}
			const { state, code_verifier } = req.body ?? {}
			if (!state) {
				reply.code(400)
				return { error: 'state is required' }
			}
			startLogin(state, code_verifier)
			return { ok: true }
		}
	)

	// 2) GET /auth/telegram/callback — Telegram redirects the popup here with
	//    ?code&state. We exchange the code (confidential client + PKCE), verify the
	//    id_token, mint a session token, and park it under `state` for the poller.
	app.get(
		'/auth/telegram/callback',
		async (req: FastifyRequest<{ Querystring: CallbackQuery }>, reply: FastifyReply) => {
			reply.type('text/html')
			const { code, state, error, error_description } = req.query ?? {}

			if (!state) {
				return htmlPage('خطا', 'پارامتر state نامعتبر است. این پنجره را ببندید.')
			}
			if (error) {
				failLogin(state, error_description || error)
				return htmlPage('ناموفق', 'ورود لغو شد. این پنجره را ببندید.')
			}
			if (!code) {
				failLogin(state, 'missing authorization code')
				return htmlPage('ناموفق', 'کد دریافت نشد. این پنجره را ببندید.')
			}
			if (!isConfigured()) {
				failLogin(state, 'server not configured')
				return htmlPage('ناموفق', 'سرور پیکربندی نشده است.')
			}

			try {
				const redirectUri = `${config.publicUrl}/auth/telegram/callback`
				const claims = await telegramLogin(code, redirectUri, getVerifier(state))
				const name = typeof claims.name === 'string' ? claims.name : null
				const username =
					typeof claims.preferred_username === 'string'
						? claims.preferred_username
						: null
				const token = signJwt({
					sub: String(claims.sub),
					name,
					username,
					provider: 'telegram',
				})
				completeLogin(state, token)
				return htmlPage(
					'ورود موفق',
					'با موفقیت وارد شدید. می‌توانید این پنجره را ببندید و به تب‌فریکس بازگردید.'
				)
			} catch (err) {
				req.log.error({ err }, 'telegram callback failed')
				failLogin(state, err instanceof Error ? err.message : String(err))
				return htmlPage(
					'ناموفق',
					'ورود با تلگرام ناموفق بود. این پنجره را ببندید و دوباره تلاش کنید.'
				)
			}
		}
	)

	// 3) GET /auth/telegram/result?state= — the extension polls this until the
	//    callback has finished. Returns { token } once (then forgets it),
	//    { error } on failure, or { pending: true } while waiting.
	app.get(
		'/auth/telegram/result',
		async (req: FastifyRequest<{ Querystring: ResultQuery }>, reply: FastifyReply) => {
			const { state } = req.query ?? {}
			if (!state) {
				reply.code(400)
				return { error: 'state is required' }
			}
			const result = takeResult(state)
			// Always 200 so the extension's polling client doesn't trip the
			// 401 -> token-refresh interceptor. The body carries the outcome.
			if (result.status === 'ok') return { token: result.token }
			if (result.status === 'error') return { error: result.error }
			return { pending: true }
		}
	)
}
