import type { FastifyInstance, FastifyRequest } from 'fastify'
import { getSnapshot } from '../db/snapshots.repo'
import { parseLang } from '../lang'

const EMPTY_CONTENTS = { contents: [] }

export async function contentsRoutes(app: FastifyInstance): Promise<void> {
	// GET /contents?lang=fa|en|it — Explorer catalog, category/link names localized.
	app.get(
		'/contents',
		async (req: FastifyRequest<{ Querystring: { lang?: string } }>, reply) => {
			const lang = parseLang(req.query.lang)
			const key =
				lang === 'en' ? 'contents:en' : lang === 'it' ? 'contents:it' : 'contents'
			const data =
				(await getSnapshot(key)) ?? (await getSnapshot('contents')) ?? EMPTY_CONTENTS
			reply.header('Cache-Control', 'public, max-age=600')
			return data
		}
	)
}
