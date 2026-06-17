import { migrate } from '../db/migrate'
import { crawl } from './crawl'
import { pool } from '../db/pool'

// CLI entry point: ensure schema, run a single crawl, then exit.
// Usage: `npm run crawl` (prod) or `npm run crawl:dev` (ts-source).
async function main() {
	await migrate()
	const result = await crawl()
	console.log('[crawl] done', result)
}

main()
	.then(() => pool.end())
	.then(() => process.exit(0))
	.catch((err) => {
		console.error('[crawl] fatal', err)
		process.exit(1)
	})
