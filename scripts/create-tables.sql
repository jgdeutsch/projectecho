-- Create runs table
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  li_at_hash TEXT NOT NULL,
  post_url TEXT NOT NULL,
  phantom_agent_id TEXT NOT NULL,
  container_id TEXT,
  status TEXT NOT NULL,
  total_urls INTEGER DEFAULT 0,
  raw_output TEXT
);

-- Create likers table
CREATE TABLE IF NOT EXISTS likers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  profile_url TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_likers_run_id ON likers(run_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at);

