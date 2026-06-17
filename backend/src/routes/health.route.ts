import type { FastifyInstance } from 'fastify'
import { pool } from '../db/pool'
import { countEvents, getLastCrawl } from '../db/events.repo'
import { listSnapshots } from '../db/snapshots.repo'

export async function healthRoutes(app: FastifyInstance): Promise<void> {
	app.get('/health', async (_req, reply) => {
		let db = false
		try {
			await pool.query('SELECT 1')
			db = true
		} catch {
			db = false
		}

		const events = db ? await countEvents().catch(() => -1) : -1
		const lastCrawl = db ? await getLastCrawl().catch(() => null) : null
		const snapshots = db ? await listSnapshots().catch(() => []) : []

		if (!db) reply.code(503)
		return {
			status: db ? 'ok' : 'degraded',
			db,
			events,
			snapshots,
			lastCrawl,
			uptime: Math.round(process.uptime()),
		}
	})
}
