import type { FastifyInstance } from 'fastify'
import { getAllEvents } from '../db/events.repo'

export async function eventsRoutes(app: FastifyInstance): Promise<void> {
	// Mirrors the upstream contract consumed by the extension.
	app.get('/date/events', async (_req, reply) => {
		const data = await getAllEvents()
		reply.header('Cache-Control', 'public, max-age=600')
		return data
	})
}
