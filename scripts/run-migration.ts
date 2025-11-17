import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log("Creating runs table...");
    await sql`
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
      )
    `;
    console.log("✅ Runs table created");

    console.log("Creating likers table...");
    await sql`
      CREATE TABLE IF NOT EXISTS likers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        profile_url TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✅ Likers table created");

    console.log("Creating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_likers_run_id ON likers(run_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at)`;
    console.log("✅ Indexes created");

    console.log("✅ Migration completed successfully!");
    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    if (error.code) {
      console.error("Error code:", error.code);
    }
    await sql.end();
    process.exit(1);
  }
}

runMigration();
