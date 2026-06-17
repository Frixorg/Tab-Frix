import type { FastifyInstance, FastifyRequest } from 'fastify'
import { getAllEvents } from '../db/events.repo'
import { parseLang } from '../lang'

export async function eventsRoutes(app: FastifyInstance): Promise<void> {
	// GET /date/events?lang=fa|en|it — titles in the requested language (fa fallback).
	app.get(
		'/date/events',
		async (req: FastifyRequest<{ Querystring: { lang?: string } }>, reply) => {
			const data = await getAllEvents(parseLang(req.query.lang))
			reply.header('Cache-Control', 'public, max-age=600')
			return data
		}
	)
}
