import { pool } from './pool'
import { SCHEMA_SQL } from './schema'

// Idempotent: safe to run on every boot. Creates tables/indexes if missing.
export async function migrate(): Promise<void> {
	await pool.query(SCHEMA_SQL)
}

// Allow running directly: `node dist/db/migrate.js`
if (require.main === module) {
	migrate()
		.then(() => {
			console.log('[migrate] schema is up to date')
			return pool.end()
		})
		.catch((err) => {
			console.error('[migrate] failed', err)
			process.exit(1)
		})
}
