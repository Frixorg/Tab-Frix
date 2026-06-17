import type { FastifyInstance } from 'fastify'
import { getSnapshot } from '../db/snapshots.repo'

// Returned before the first successful crawl so the extension never breaks.
const EMPTY_SEARCHBOX = {
	search_engines: [],
	recommendedSites: [],
	explorer: { newBadge: false },
	selected_engine: null,
}

export async function searchboxRoutes(app: FastifyInstance): Promise<void> {
	// Mirrors GET /searchbox. Query params (region/limit) are accepted but ignored —
	// we serve the stored global snapshot. selected_engine stays null; the extension
	// tracks the user's chosen engine in its own local storage.
	app.get('/searchbox', async (_req, reply) => {
		const data = await getSnapshot('searchbox')
		reply.header('Cache-Control', 'public, max-age=600')
		return data ?? EMPTY_SEARCHBOX
	})
}
