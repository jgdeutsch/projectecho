# Database Migrations Guide

## Running Migrations

After connecting your Neon database to Vercel, you need to create the database tables.

### Option 1: Run Locally (Recommended for First Time)

1. Make sure you have your production `DATABASE_URL` from Vercel
2. Temporarily set it in your `.env.local`:
   ```bash
   DATABASE_URL=your_production_database_url_here
   ```
3. Run the migration:
   ```bash
   pnpm db:push
   ```

### Option 2: Run via Vercel CLI

1. Install Vercel CLI if you haven't:
   ```bash
   npm i -g vercel
   ```
2. Pull environment variables:
   ```bash
   vercel env pull .env.local
   ```
3. Run migrations:
   ```bash
   pnpm db:push
   ```

### Option 3: Create a One-Time Migration Script

You can create a script that runs migrations on Vercel deployment. However, for Neon, it's usually easier to run migrations locally pointing to production.

## Verify Tables Were Created

After running migrations, you should have:
- `runs` table with columns: id, created_at, li_at_hash, post_url, phantom_agent_id, container_id, status, total_urls, raw_output
- `likers` table with columns: id, run_id, profile_url, created_at

You can verify this in Neon's dashboard SQL editor or by running:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

