import Fastify, { type FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import { config } from './config'
import { eventsRoutes } from './routes/events.route'
import { searchboxRoutes } from './routes/searchbox.route'
import { contentsRoutes } from './routes/contents.route'
import { healthRoutes } from './routes/health.route'

export async function buildServer(): Promise<FastifyInstance> {
	const app = Fastify({
		logger: { level: process.env.LOG_LEVEL ?? 'info' },
		trustProxy: true, // sits behind Nginx
	})

	await app.register(cors, {
		origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
		methods: ['GET', 'OPTIONS'],
		// The extension sends these custom headers via its axios client.
		allowedHeaders: ['Content-Type', 'Authorization', 'client', 'version'],
	})

	await app.register(eventsRoutes)
	await app.register(searchboxRoutes)
	await app.register(contentsRoutes)
	await app.register(healthRoutes)

	app.get('/', async () => ({
		name: 'tabfrix-events-backend',
		endpoints: ['/date/events', '/searchbox', '/contents', '/health'],
	}))

	return app
}
