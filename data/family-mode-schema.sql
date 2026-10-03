-- Dinliminate Family Mode foundation schema.
-- The runtime API applies this schema with CREATE TABLE IF NOT EXISTS.
CREATE TABLE IF NOT EXISTS din_family (
  family_id TEXT PRIMARY KEY,
  join_code TEXT NOT NULL UNIQUE,
  family_name TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL,
  current_host_id TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS din_family_participant (
  participant_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES din_family(family_id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS din_family_participant_family_idx
  ON din_family_participant(family_id);

CREATE TABLE IF NOT EXISTS din_family_round (
  round_id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES din_family(family_id) ON DELETE CASCADE,
  round_type TEXT NOT NULL CHECK (round_type IN ('food','restaurant')),
  stage TEXT NOT NULL CHECK (stage IN ('setup','swiping','finalists','final_vote','tie_break','winner','ended')),
  status TEXT NOT NULL CHECK (status IN ('active','completed','ended')),
  dinner_target_at TIMESTAMPTZ,
  pool JSONB NOT NULL DEFAULT '[]'::jsonb,
  host_excluded JSONB NOT NULL DEFAULT '[]'::jsonb,
  finalists JSONB NOT NULL DEFAULT '[]'::jsonb,
  winner JSONB,
  schema_version INTEGER NOT NULL DEFAULT 1,
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS din_family_round_family_idx
  ON din_family_round(family_id, created_at DESC);

CREATE TABLE IF NOT EXISTS din_family_round_participant (
  round_id TEXT NOT NULL REFERENCES din_family_round(round_id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES din_family_participant(participant_id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('host','member')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  stage_done BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (round_id, participant_id)
);

CREATE TABLE IF NOT EXISTS din_family_vote (
  round_id TEXT NOT NULL REFERENCES din_family_round(round_id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL REFERENCES din_family_participant(participant_id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('swiping','finalists','final_vote','tie_break')),
  item_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('cut','maybe','choose')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (round_id, participant_id, stage, item_id)
);

CREATE INDEX IF NOT EXISTS din_family_vote_round_stage_idx
  ON din_family_vote(round_id, stage);
