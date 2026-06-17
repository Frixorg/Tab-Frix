import crypto from 'node:crypto'
import { config } from '../config'

// Telegram OIDC (https://oauth.telegram.org/.well-known/openid-configuration)
const ISSUER = 'https://oauth.telegram.org'
const TOKEN_ENDPOINT = 'https://oauth.telegram.org/token'
const JWKS_URI = 'https://oauth.telegram.org/.well-known/jwks.json'

export interface TelegramClaims {
	sub: string
	name?: string
	preferred_username?: string
	picture?: string
	phone_number?: string
	iss?: string
	aud?: string | string[]
	exp?: number
	[k: string]: unknown
}

function b64urlDecode(s: string): Buffer {
	return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}
function b64url(input: Buffer | string): string {
	return Buffer.from(input)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
}

// Exchange the authorization code for tokens (confidential client, secret in body).
async function exchangeCode(
	code: string,
	redirectUri: string,
	codeVerifier?: string
): Promise<string> {
	const body = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri,
		client_id: config.telegramClientId,
		client_secret: config.telegramClientSecret,
	})
	if (codeVerifier) body.set('code_verifier', codeVerifier)

	const res = await fetch(TOKEN_ENDPOINT, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			accept: 'application/json',
		},
		body,
	})
	if (!res.ok) {
		throw new Error(`token endpoint ${res.status}: ${await res.text().catch(() => '')}`.slice(0, 240))
	}
	const data = (await res.json()) as { id_token?: string }
	if (!data.id_token) throw new Error('no id_token in token response')
	return data.id_token
}

let jwksCache: { keys: Record<string, unknown>[]; at: number } | null = null
async function getJwks(): Promise<Record<string, unknown>[]> {
	if (jwksCache && Date.now() - jwksCache.at < 60 * 60 * 1000) return jwksCache.keys
	const res = await fetch(JWKS_URI, { headers: { accept: 'application/json' } })
	if (!res.ok) throw new Error(`jwks ${res.status}`)
	const data = (await res.json()) as { keys?: Record<string, unknown>[] }
	jwksCache = { keys: data.keys ?? [], at: Date.now() }
	return jwksCache.keys
}

// Verify a Telegram id_token (RS256/ES256) against the JWKS and standard claims.
export async function verifyIdToken(idToken: string): Promise<TelegramClaims> {
	const [h, p, s] = idToken.split('.')
	if (!h || !p || !s) throw new Error('malformed id_token')
	const header = JSON.parse(b64urlDecode(h).toString('utf8')) as { alg: string; kid?: string }
	const claims = JSON.parse(b64urlDecode(p).toString('utf8')) as TelegramClaims

	const keys = await getJwks()
	const jwk = (keys.find((k) => k.kid === header.kid) ?? keys[0]) as crypto.JsonWebKey | undefined
	if (!jwk) throw new Error('no matching jwk')
	const pub = crypto.createPublicKey({ key: jwk, format: 'jwk' })

	const signingInput = Buffer.from(`${h}.${p}`)
	const sig = b64urlDecode(s)
	let ok = false
	if (header.alg === 'RS256') {
		ok = crypto.verify('RSA-SHA256', signingInput, pub, sig)
	} else if (header.alg === 'ES256') {
		ok = crypto.verify('sha256', signingInput, { key: pub, dsaEncoding: 'ieee-p1363' }, sig)
	} else {
		throw new Error(`unsupported id_token alg: ${header.alg}`)
	}
	if (!ok) throw new Error('id_token signature invalid')

	if (claims.iss !== ISSUER) throw new Error('bad issuer')
	const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
	if (!aud.includes(config.telegramClientId)) throw new Error('bad audience')
	if (!claims.exp || claims.exp * 1000 < Date.now()) throw new Error('id_token expired')
	return claims
}

// Full login: exchange code -> verify id_token -> return claims.
export async function telegramLogin(
	code: string,
	redirectUri: string,
	codeVerifier?: string
): Promise<TelegramClaims> {
	const idToken = await exchangeCode(code, redirectUri, codeVerifier)
	return verifyIdToken(idToken)
}

// Minimal HS256 JWT signer for our own session token.
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
