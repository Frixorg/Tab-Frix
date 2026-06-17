import type { FastifyInstance, FastifyRequest } from 'fastify'
import { config } from '../config'
import { signJwt, telegramLogin } from '../auth/telegram'

interface TelegramLoginBody {
	code?: string
	redirect_uri?: string
	code_verifier?: string
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
	// POST /auth/telegram — Telegram OIDC code exchange. The frontend runs the
	// authorization-code (+PKCE) flow and posts { code, redirect_uri, code_verifier };
	// we exchange the code with the client secret, verify the id_token, and issue a
	// session token. Requires TELEGRAM_CLIENT_ID/SECRET + AUTH_JWT_SECRET.
	app.post(
		'/auth/telegram',
		async (req: FastifyRequest<{ Body: TelegramLoginBody }>, reply) => {
			if (!config.telegramClientId || !config.telegramClientSecret || !config.authJwtSecret) {
				reply.code(501)
				return { error: 'telegram auth is not configured on this server' }
			}
			const { code, redirect_uri, code_verifier } = req.body ?? {}
			if (!code || !redirect_uri) {
				reply.code(400)
				return { error: 'code and redirect_uri are required' }
			}
			try {
				const claims = await telegramLogin(code, redirect_uri, code_verifier)
				const name = typeof claims.name === 'string' ? claims.name : null
				const username =
					typeof claims.preferred_username === 'string' ? claims.preferred_username : null
				const token = signJwt({
					sub: String(claims.sub),
					name,
					username,
					provider: 'telegram',
				})
				return {
					token,
					isNewUser: false,
					user: {
						id: String(claims.sub),
						name,
						username,
						avatar: typeof claims.picture === 'string' ? claims.picture : null,
					},
				}
			} catch (err) {
				reply.code(401)
				return {
					error: 'telegram login failed',
					detail: err instanceof Error ? err.message : String(err),
				}
			}
		}
	)
}
