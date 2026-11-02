CREATE TABLE IF NOT EXISTS chat_turns (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('generating', 'completed', 'stopped', 'error')),
  model TEXT NOT NULL DEFAULT '',
  interface_locale TEXT NOT NULL,
  source_ids TEXT NOT NULL DEFAULT '[]',
  error_code TEXT NOT NULL DEFAULT '',
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  duration_ms INTEGER
);
CREATE INDEX IF NOT EXISTS chat_turns_conversation_time ON chat_turns (conversation_id, started_at);
CREATE INDEX IF NOT EXISTS chat_turns_started_at ON chat_turns (started_at);
