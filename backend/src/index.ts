import cron from 'node-cron'
import { config } from './config'
import { buildServer } from './server'
import { migrate } from './db/migrate'
import { crawl } from './crawler/crawl'
import { countEvents } from './db/events.repo'
import { pool } from './db/pool'

async function main(): Promise<void> {
	// 1. Ensure the schema exists.
	await migrate()

	// 2. Seed on first boot if the table is empty (best-effort; never blocks start).
	if (config.crawlOnStartIfEmpty) {
		try {
			if ((await countEvents()) === 0) {
				console.log('[boot] events table empty — running initial crawl')
				await crawl().catch((err) =>
					console.error('[boot] initial crawl failed', err)
				)
			}
		} catch (err) {
			console.error('[boot] startup crawl check failed', err)
		}
	}

	// 3. Schedule the recurring crawl.
	if (cron.validate(config.crawlCron)) {
		cron.schedule(config.crawlCron, () => {
			crawl().catch((err) => console.error('[cron] scheduled crawl failed', err))
		})
		console.log(`[boot] crawl scheduled: "${config.crawlCron}"`)
	} else {
		console.warn(`[boot] invalid CRAWL_CRON "${config.crawlCron}" — skipping schedule`)
	}

	// 4. Start the HTTP server.
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
