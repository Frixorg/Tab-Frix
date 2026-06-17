import { Pool } from 'pg'
import { config } from '../config'

// A single shared connection pool for the whole process.
export const pool = new Pool({
	connectionString: config.databaseUrl,
	max: Number(process.env.PG_POOL_MAX ?? 10),
	idleTimeoutMillis: 30000,
})

pool.on('error', (err) => {
	// Don't crash on an idle client error; just log it.
	console.error('[pg] unexpected idle client error', err)
})
