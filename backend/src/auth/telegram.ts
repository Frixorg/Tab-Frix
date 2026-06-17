import crypto from 'node:crypto'
import { config } from '../config'

// Payload returned by the Telegram Login Widget.
export interface TelegramAuthData {
	id: number | string
	first_name?: string
	last_name?: string
	username?: string
	photo_url?: string
	auth_date: number | string
	hash: string
	[k: string]: unknown
}

// Verify the Telegram login signature per https://core.telegram.org/widgets/login
// (HMAC-SHA256 of the data-check-string with key = SHA256(bot_token)).
export function verifyTelegramAuth(data: TelegramAuthData): boolean {
	if (!config.telegramBotToken || !data || typeof data.hash !== 'string') return false

	const { hash, ...rest } = data
	const checkString = Object.keys(rest)
		.filter((k) => rest[k] !== undefined && rest[k] !== null)
		.sort()
		.map((k) => `${k}=${rest[k]}`)
		.join('\n')

	const secret = crypto.createHash('sha256').update(config.telegramBotToken).digest()
	const computed = crypto.createHmac('sha256', secret).update(checkString).digest('hex')

	let a: Buffer
	let b: Buffer
	try {
		a = Buffer.from(computed, 'hex')
		b = Buffer.from(hash, 'hex')
	} catch {
		return false
	}
	if (a.length === 0 || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
		return false
	}

	// Reject stale logins (older than 1 day).
	const authMs = Number(data.auth_date) * 1000
	if (!Number.isFinite(authMs) || Date.now() - authMs > 24 * 60 * 60 * 1000) {
		return false
	}
	return true
}

function b64url(input: Buffer | string): string {
	return Buffer.from(input)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
}

// Minimal HS256 JWT signer (no extra dependency).
export function signJwt(payload: Record<string, unknown>): string {
	const now = Math.floor(Date.now() / 1000)
	const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
	const body = b64url(
		JSON.stringify({ ...payload, iat: now, exp: now + config.authTokenTtlSec })
	)
	const sig = b64url(
		crypto.createHmac('sha256', config.authJwtSecret).update(`${header}.${body}`).digest()
	)
	return `${header}.${body}.${sig}`
}
