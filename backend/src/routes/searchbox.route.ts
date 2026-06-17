import type { FastifyInstance, FastifyRequest } from 'fastify'
import { getSnapshot } from '../db/snapshots.repo'
import { parseLang } from '../lang'

const EMPTY_SEARCHBOX = {
	search_engines: [],
	recommendedSites: [],
	explorer: { newBadge: false },
	selected_engine: null,
}

export async function searchboxRoutes(app: FastifyInstance): Promise<void> {
	// GET /searchbox?lang=fa|en|it — localized label/title (fa fallback).
	app.get(
		'/searchbox',
		async (req: FastifyRequest<{ Querystring: { lang?: string } }>, reply) => {
			const lang = parseLang(req.query.lang)
			const key =
				lang === 'en' ? 'searchbox:en' : lang === 'it' ? 'searchbox:it' : 'searchbox'
			const data =
				(await getSnapshot(key)) ?? (await getSnapshot('searchbox')) ?? EMPTY_SEARCHBOX
			reply.header('Cache-Control', 'public, max-age=600')
			return data
		}
	)
}
