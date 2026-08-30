CREATE TABLE IF NOT EXISTS demo_workspaces (
    id TEXT PRIMARY KEY NOT NULL,
    expires_at BIGINT NOT NULL,
    lesson_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_demo_workspaces_expiry ON demo_workspaces(expires_at);
