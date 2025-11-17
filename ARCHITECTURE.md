# Project Echo - Architecture Overview

## High-Level Architecture

Project Echo is a Next.js 14 application that provides a web interface for launching PhantomBuster agents to scrape LinkedIn post likers. The app uses Server-Sent Events (SSE) for real-time streaming of logs and results.

## Architecture Components

### Frontend (React/Next.js)

1. **Main Page (`app/page.tsx`)**
   - Orchestrates all UI components
   - Manages state (logs, likers, progress, runId)
   - Handles EventSource connection for SSE streaming
   - Updates UI in real-time as events arrive

2. **Components**
   - `Form.tsx`: Input form for li_at cookie and post URL
   - `ProgressBar.tsx`: Visual progress indicator (0-100%)
   - `Terminal.tsx`: Mac-style terminal for streaming logs
   - `ResultsTable.tsx`: Table displaying discovered LinkedIn profile URLs with download button

### Backend API Routes

1. **POST `/api/run`**
   - Validates input (li_at cookie, post URL)
   - Launches PhantomBuster agent via API
   - Creates run record in database
   - Returns `runId` and `containerId`

2. **GET `/api/stream/[runId]`** (SSE)
   - Streams real-time updates using Server-Sent Events
   - Polls PhantomBuster container status every 4 seconds
   - Extracts logs and LinkedIn URLs from responses
   - Saves URLs to database as they're discovered
   - Emits events: `log`, `url`, `done`, `error`
   - Updates run status in database on completion/error

3. **GET `/api/download?runId=...`**
   - Queries all likers for a given run
   - Generates CSV file with headers: `index,profileUrl,runId,createdAt`
   - Returns CSV as downloadable file

### Database (Neon Postgres + Drizzle ORM)

**Schema:**
- `runs` table: Stores each scrape run with metadata
- `likers` table: Stores discovered LinkedIn profile URLs linked to runs

**Relations:**
- One-to-many: `runs` → `likers` (cascade delete)

### External APIs

**PhantomBuster API:**
- `POST /api/v2/agents/launch`: Launches agent with arguments
- `GET /api/v2/containers/fetch`: Polls container status and output

## Data Flow

1. **User submits form** → POST `/api/run`
2. **Server launches PhantomBuster** → Gets `containerId`
3. **Server creates run record** → Returns `runId` to client
4. **Client opens SSE stream** → GET `/api/stream/[runId]`
5. **Server polls PhantomBuster** → Every 4 seconds
6. **Server extracts data** → Logs and URLs from response
7. **Server streams events** → Client receives via SSE
8. **Client updates UI** → Terminal logs, results table, progress bar
9. **Server saves to DB** → URLs inserted as discovered
10. **On completion** → Run status updated, CSV available for download

## Key Design Decisions

1. **SSE over WebSockets**: Simpler for one-way streaming, built into browsers
2. **Progress calculation**: Based on poll count (max 30 polls = 100%)
3. **URL deduplication**: Server-side Set ensures no duplicates
4. **Cookie security**: Only hash stored in database, never plain text
5. **Real-time updates**: Both logs and URLs stream as they're discovered
6. **Database persistence**: All runs and results saved for history/audit

## Environment Variables

- `PHANTOMBUSTER_API_KEY`: API key for PhantomBuster
- `DATABASE_URL`: Neon Postgres connection string

## Error Handling

- API errors return JSON with error messages
- SSE stream closes on error with error event
- Database errors logged and returned to client
- PhantomBuster errors detected in output and streamed to client

