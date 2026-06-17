// Short-lived, in-memory store for the Telegram popup login flow.
//
// The extension opens the Telegram authorization page in a normal popup window
// (a first-party browser context — the only context where Telegram's polling
// login page initialises correctly). Telegram redirects back to the backend
// callback, which finishes the OIDC exchange and parks the resulting session
// token here keyed by the random `state`. The extension then polls
// /auth/telegram/result?state=... to pick it up.
//
// Entries are one-shot (deleted when the result is read) and expire after TTL.

interface PendingLogin {
	verifier?: string
	token?: string
	error?: string
	createdAt: number
}

const TTL_MS = 5 * 60 * 1000
const store = new Map<string, PendingLogin>()

function sweep(): void {
	const now = Date.now()
	for (const [key, value] of store) {
		if (now - value.createdAt > TTL_MS) store.delete(key)
	}
}

// Called by /auth/telegram/start before the popup opens. Stores the PKCE
// verifier so the callback (a separate request from Telegram) can complete the
// code exchange for this `state`.
export function startLogin(state: string, verifier?: string): void {
	sweep()
	store.set(state, { verifier, createdAt: Date.now() })
}

export function getVerifier(state: string): string | undefined {
	return store.get(state)?.verifier
}

export function completeLogin(state: string, token: string): void {
	const existing = store.get(state)
	if (existing) {
		existing.token = token
	} else {
		store.set(state, { token, createdAt: Date.now() })
	}
}

export function failLogin(state: string, error: string): void {
	const existing = store.get(state)
	if (existing) {
		existing.error = error
	} else {
		store.set(state, { error, createdAt: Date.now() })
	}
}

export type LoginResult =
	| { status: 'pending' }
	| { status: 'unknown' }
	| { status: 'ok'; token: string }
	| { status: 'error'; error: string }

// One-shot read used by the polling endpoint. Removes the entry once a terminal
// (ok/error) result is returned.
export function takeResult(state: string): LoginResult {
	sweep()
	const entry = store.get(state)
	if (!entry) return { status: 'unknown' }
	if (entry.token) {
		store.delete(state)
		return { status: 'ok', token: entry.token }
	}
	if (entry.error) {
		store.delete(state)
		return { status: 'error', error: entry.error }
	}
	return { status: 'pending' }
}
