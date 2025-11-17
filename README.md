# Project Echo

A Next.js application for scraping LinkedIn post likers using PhantomBuster's API. This app provides a web interface to launch PhantomBuster agents, stream results in real-time, and download the scraped data.

## Features

- 🚀 Launch PhantomBuster agents via web UI
- 📊 Real-time progress tracking and streaming logs
- 💾 Automatic database storage of runs and results
- 📥 CSV download functionality
- 🖥️ Mac-style terminal interface for logs
- 📈 Progress bar with status updates

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Neon Postgres with Drizzle ORM
- **Styling**: Tailwind CSS
- **Streaming**: Server-Sent Events (SSE)

## Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- A PhantomBuster account with API key
- A Neon Postgres database (or any Postgres database)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone git@github.com:jgdeutsch/projectecho.git
cd projectecho
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
PHANTOMBUSTER_API_KEY=your_phantombuster_api_key_here
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

**Getting your PhantomBuster API Key:**
1. Log in to your PhantomBuster account
2. Go to Settings → API
3. Copy your API key

**Getting your Neon Database URL:**
1. Create a new project in Neon (https://neon.tech)
2. Copy the connection string from your project dashboard
3. It should look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

### 4. Database Setup

Generate and run migrations:

```bash
# Generate migration files
pnpm db:generate

# Push schema to database (for development)
pnpm db:push

# Or run migrations (for production)
pnpm db:migrate
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter your LinkedIn credentials:**
   - Paste your LinkedIn `li_at` cookie in the first field
   - Enter the LinkedIn post URL you want to scrape likers from

2. **Start the scrape:**
   - Click "Start Scrape"
   - Watch the progress bar and terminal for real-time updates
   - Results will appear in the table as they're discovered

3. **Download results:**
   - Once the scrape is complete, click "Download CSV" to export all results

## Project Structure

```
projectecho/
├── app/
│   ├── api/
│   │   ├── run/              # POST endpoint to launch PhantomBuster agent
│   │   ├── stream/[runId]/   # SSE endpoint for real-time updates
│   │   └── download/         # CSV download endpoint
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page component
├── components/
│   ├── Form.tsx              # Input form component
│   ├── ProgressBar.tsx       # Progress bar component
│   ├── Terminal.tsx          # Terminal log viewer
│   └── ResultsTable.tsx      # Results table with download
├── db/
│   ├── schema.ts             # Drizzle schema definitions
│   └── index.ts              # Database connection
├── lib/
│   ├── phantombuster.ts      # PhantomBuster API client
│   └── utils.ts              # Utility functions
└── drizzle.config.ts         # Drizzle configuration
```

## Database Schema

### `runs` table
- `id` (UUID, primary key)
- `created_at` (timestamp)
- `li_at_hash` (text) - Hashed version of the cookie
- `post_url` (text)
- `phantom_agent_id` (text)
- `container_id` (text)
- `status` (text) - "running", "finished", or "error"
- `total_urls` (integer)
- `raw_output` (text, nullable)

### `likers` table
- `id` (UUID, primary key)
- `run_id` (UUID, foreign key to runs.id)
- `profile_url` (text)
- `created_at` (timestamp)

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git remote add origin git@github.com:jgdeutsch/projectecho.git
   git add .
   git commit -m "Initial Project Echo app"
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `PHANTOMBUSTER_API_KEY`
     - `DATABASE_URL`
   - Deploy

3. **Run migrations on Vercel:**
   - After deployment, run migrations using Vercel's CLI or dashboard
   - Or use `pnpm db:push` locally pointing to your production database

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Drizzle migration files
- `pnpm db:push` - Push schema changes to database (dev)
- `pnpm db:migrate` - Run migrations (production)
- `pnpm db:studio` - Open Drizzle Studio (database GUI)

## Notes

- The app uses Server-Sent Events (SSE) for real-time streaming
- LinkedIn cookies (`li_at`) are hashed before storage for security
- The PhantomBuster agent ID is hardcoded: `6747273483102031`
- Maximum polling attempts: 30 (configurable in code)
- Poll interval: 4 seconds

## Troubleshooting

**Database connection errors:**
- Verify your `DATABASE_URL` is correct
- Ensure your Neon database allows connections from your IP/Vercel
- Check that SSL mode is set correctly

**PhantomBuster API errors:**
- Verify your API key is correct
- Check that your PhantomBuster account has credits
- Ensure the agent ID is correct

**Streaming not working:**
- Check browser console for errors
- Verify SSE endpoint is accessible
- Check that the run was created successfully

## License

MIT

