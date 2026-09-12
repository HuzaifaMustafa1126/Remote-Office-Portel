-- Phase 3.4: support efficient employee presence checks for active task sessions.
CREATE INDEX idx_auth_sessions_presence
  ON auth_sessions(status, last_seen_at, user_id);
