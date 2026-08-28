CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    learner_name TEXT,
    share_code TEXT NOT NULL UNIQUE,
    tutor_token_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS checkpoints (
    id TEXT PRIMARY KEY NOT NULL,
    lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    title TEXT NOT NULL,
    command TEXT NOT NULL,
    success_hint TEXT,
    UNIQUE (lesson_id, position)
);

CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY NOT NULL,
    checkpoint_id TEXT NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('passed', 'blocked')),
    output TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    consented INTEGER NOT NULL CHECK (consented = 1),
    teacher_reply TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    replied_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_lesson ON checkpoints(lesson_id, position);
CREATE INDEX IF NOT EXISTS idx_submissions_checkpoint ON submissions(checkpoint_id, created_at DESC);

