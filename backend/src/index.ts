import { config } from './config'
import { buildServer } from './server'
import { migrate } from './db/migrate'
import { crawl } from './crawler/crawl'
import { countEvents } from './db/events.repo'
import { getSnapshot } from './db/snapshots.repo'
import { pool } from './db/pool'

async function main(): Promise<void> {
	// 1. Ensure the schema exists.
	await migrate()

	// 2. One-time seed: if the table is empty, crawl the full-year snapshot once.
	//    The upstream feed is a static yearly dataset (events keyed by month/day, no
	//    year), so there is no recurring crawl — refresh manually with `npm run crawl`.
	if (config.crawlOnStartIfEmpty) {
		try {
			const needSeed =
				(await countEvents()) === 0 || (await getSnapshot('searchbox')) === null
			if (needSeed) {
				console.log('[boot] missing data — running initial crawl')
				await crawl().catch((err) =>
					console.error('[boot] initial crawl failed', err)
				)
			}
		} catch (err) {
			console.error('[boot] startup crawl check failed', err)
		}
	}

	// 3. Start the HTTP server.
	const app = await buildServer()
	await app.listen({ port: config.port, host: config.host })

	const shutdown = async (signal: string) => {
		console.log(`[shutdown] ${signal} received`)
		try {
			await app.close()
		} catch {
			/* ignore */
		}
		try {
			await pool.end()
		} catch {
			/* ignore */
		}
		process.exit(0)
	}
	process.on('SIGINT', () => void shutdown('SIGINT'))
	process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

main().catch((err) => {
	console.error('[fatal] failed to start', err)
	process.exit(1)
})
