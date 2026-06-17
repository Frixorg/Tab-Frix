import { pool } from './pool'

// A "snapshot" is the raw JSON of a static upstream endpoint we mirror verbatim
// (e.g. the /searchbox payload). One row per endpoint, keyed by a short name.

export async function putSnapshot(key: string, payload: unknown): Promise<void> {
	await pool.query(
		`INSERT INTO snapshots (key, payload, updated_at)
		 VALUES ($1, $2::jsonb, now())
		 ON CONFLICT (key) DO UPDATE
		   SET payload = EXCLUDED.payload, updated_at = now()`,
		[key, JSON.stringify(payload)]
	)
}

export async function getSnapshot<T = unknown>(key: string): Promise<T | null> {
	const { rows } = await pool.query<{ payload: T }>(
		'SELECT payload FROM snapshots WHERE key = $1',
		[key]
	)
	return rows[0]?.payload ?? null
}

export async function listSnapshots(): Promise<
	Array<{ key: string; updated_at: string }>
> {
	const { rows } = await pool.query<{ key: string; updated_at: string }>(
		'SELECT key, updated_at FROM snapshots ORDER BY key'
	)
	return rows
}
