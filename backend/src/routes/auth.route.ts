import type { FastifyInstance, FastifyRequest } from 'fastify'
import { config } from '../config'
import { signJwt, verifyTelegramAuth, type TelegramAuthData } from '../auth/telegram'

export async function authRoutes(app: FastifyInstance): Promise<void> {
	// POST /auth/telegram — verify the Telegram Login Widget payload and issue a
	// session token. Requires TELEGRAM_BOT_TOKEN + AUTH_JWT_SECRET to be set.
	app.post(
		'/auth/telegram',
		async (req: FastifyRequest<{ Body: TelegramAuthData }>, reply) => {
			if (!config.telegramBotToken || !config.authJwtSecret) {
				reply.code(501)
				return { error: 'telegram auth is not configured on this server' }
			}
			const data = req.body
			if (!verifyTelegramAuth(data)) {
				reply.code(401)
				return { error: 'invalid telegram authentication' }
			}
			const name = [data.first_name, data.last_name].filter(Boolean).join(' ')
			const token = signJwt({
				sub: String(data.id),
				name,
				username: data.username ?? null,
				provider: 'telegram',
			})
			return {
				token,
				isNewUser: false,
				user: {
					id: String(data.id),
					name,
					username: data.username ?? null,
					avatar: data.photo_url ?? null,
				},
			}
		}
	)
}
