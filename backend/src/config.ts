// Central runtime configuration, sourced from environment variables.
// See .env.example for documentation of each value.

function bool(value: string | undefined, fallback: boolean): boolean {
	if (value === undefined) return fallback
	return value === 'true' || value === '1' || value === 'yes'
}

export const config = {
	port: Number(process.env.PORT ?? 3000),
	host: process.env.HOST ?? '0.0.0.0',

	// PostgreSQL connection string, e.g. postgres://user:pass@host:5432/db
	databaseUrl:
		process.env.DATABASE_URL ??
		'postgres://tabfrix:tabfrix@localhost:5432/tabfrix',

	// Upstream source that we crawl for the events feed.
	upstreamUrl: (process.env.UPSTREAM_API ?? 'https://api.widgetify.ir').replace(
		/\/+$/,
		''
	),
	// The upstream API expects this client header.
	clientHeader: process.env.UPSTREAM_CLIENT_HEADER ?? 'widgetify-extension',
	upstreamTimeoutMs: Number(process.env.UPSTREAM_TIMEOUT_MS ?? 15000),

	// One-time seed: crawl once on boot if the events table is empty. The upstream
	// feed is a static full-year dataset, so there is no recurring/scheduled crawl.
	crawlOnStartIfEmpty: bool(process.env.CRAWL_ON_START, true),

	// CORS: '*' for any origin, or a comma-separated allow-list.
	corsOrigin: process.env.CORS_ORIGIN ?? '*',

	nodeEnv: process.env.NODE_ENV ?? 'development',
}

export type AppConfig = typeof config
