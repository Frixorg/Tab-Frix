// Schema kept as an inline string so it ships in the compiled dist/ without
// needing to copy a separate .sql file during the Docker build.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS events (
	id          SERIAL PRIMARY KEY,
	calendar    TEXT    NOT NULL CHECK (calendar IN ('shamsi', 'gregorian', 'hijri')),
	title       TEXT    NOT NULL,
	title_en    TEXT,
	title_it    TEXT,
	month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
	day         INTEGER NOT NULL CHECK (day BETWEEN 1 AND 31),
	is_holiday  BOOLEAN NOT NULL DEFAULT FALSE,
	icon        TEXT,
	created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (calendar, month, day, title)
);

-- Idempotent upgrades for installs created before translation columns existed.
ALTER TABLE events ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS title_it TEXT;

CREATE INDEX IF NOT EXISTS idx_events_calendar ON events (calendar);

CREATE TABLE IF NOT EXISTS crawl_runs (
	id              SERIAL PRIMARY KEY,
	started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
	finished_at     TIMESTAMPTZ,
	ok              BOOLEAN,
	shamsi_count    INTEGER DEFAULT 0,
	gregorian_count INTEGER DEFAULT 0,
	hijri_count     INTEGER DEFAULT 0,
	error           TEXT
);

-- Generic key/value store for static global endpoints we crawl verbatim
-- (e.g. 'searchbox', 'searchbox:en', 'searchbox:it').
CREATE TABLE IF NOT EXISTS snapshots (
	key        TEXT PRIMARY KEY,
	payload    JSONB NOT NULL,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Translation cache: source Persian text -> en/it, so re-crawls don't re-translate
-- unchanged strings (saves LLM calls/cost).
CREATE TABLE IF NOT EXISTS translations (
	source     TEXT PRIMARY KEY,
	en         TEXT,
	it         TEXT,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`
