// Schema kept as an inline string so it ships in the compiled dist/ without
// needing to copy a separate .sql file during the Docker build.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS events (
	id          SERIAL PRIMARY KEY,
	calendar    TEXT    NOT NULL CHECK (calendar IN ('shamsi', 'gregorian', 'hijri')),
	title       TEXT    NOT NULL,
	month       INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
	day         INTEGER NOT NULL CHECK (day BETWEEN 1 AND 31),
	is_holiday  BOOLEAN NOT NULL DEFAULT FALSE,
	icon        TEXT,
	created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
	UNIQUE (calendar, month, day, title)
);

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
`
