# Mini Kanban Board

A small Kanban board application: users register, create boards, share them with other registered users under an explicit **OWNER / EDITOR / VIEWER** role model, and organize work across columns and tasks with drag-and-drop reordering.

Built for a technical assessment. The two things it leans hardest on are:

1. **Order consistency** — the task-move API stays correct and cheap under concurrent, repeated reordering (see [Ordering strategy](#ordering-strategy)).
2. **Authorization** — every board/column/task mutation is checked against board membership and role, with defenses against cross-board id tampering (see [Authorization model](#authorization-model)).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| Database | PostgreSQL + Prisma |
| Drag-and-drop | `@dnd-kit` (accessible, multi-container sortable) |
| Server state | TanStack React Query |
| Containerization | Docker + Docker Compose |

## Project structure

```
backend/    NestJS API (auth, boards, columns, tasks, ordering engine)
frontend/   Next.js app (auth pages, boards list, Kanban board view)
docker-compose.yml   spins up Postgres + both apps
```

---

## Quick start (Docker)

This is the fastest way to run the whole stack.

1. Copy the root env file and adjust if you like (defaults work out of the box):
   ```
   cp .env.example .env
   ```
2. From the repository root:
   ```
   docker compose up --build
   ```
3. Once it's up:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Swagger API docs: http://localhost:3001/docs

The backend container runs `prisma migrate deploy` automatically on startup, so the database schema is created for you — no manual migration step needed.

## Manual setup (without Docker)

You'll need Node.js 20+ and a PostgreSQL 14+ instance running locally.

### 1. Database

Create a database and user (adjust to taste):

```sql
CREATE ROLE kanban WITH LOGIN PASSWORD 'kanban_dev_password';
CREATE DATABASE kanban OWNER kanban;
```

### 2. Backend

```
cd backend
cp .env.example .env      # edit DATABASE_URL/DIRECT_URL if your DB differs
npm install
npx prisma migrate deploy
npm run start:dev
```

The API listens on `http://localhost:3001` (`PORT` in `.env`).

### 3. Frontend

```
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The app listens on `http://localhost:3000` and expects `NEXT_PUBLIC_API_URL` (in `.env.local`) to point at the backend above.

---

## Environment variables

### `backend/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string used for normal queries. |
| `DIRECT_URL` | Non-pooled connection string used only for running migrations. Against a plain Postgres instance (local/Docker) this can be the same value as `DATABASE_URL`; against a pooled provider (e.g. Neon, PgBouncer) it must be the direct/unpooled connection. |
| `JWT_SECRET` | Secret used to sign access tokens. Use a long random value outside local dev. |
| `JWT_EXPIRES_IN` | Access token lifetime (default `7d`). |
| `PORT` | Port the API listens on (default `3001`). |
| `CORS_ORIGIN` | Comma-separated list of origins allowed to call the API. |

### `frontend/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API, **reachable from the browser** (not a Docker-internal hostname — API calls happen client-side). |

### Root `.env` (Docker Compose only)

See `.env.example` at the repository root — `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`, plus the backend/frontend variables above, all wired together automatically by `docker-compose.yml`.

---

## Architecture

### Data model

`User` → `Board` (has an `ownerId`) → `Column` → `Task`, plus a `BoardMember` join table (`boardId`, `userId`, `role`). The board owner is *also* a `BoardMember` row with role `OWNER`, created transactionally at board creation — every authorization check, owner included, is one uniform membership lookup rather than a special-cased owner branch.

```
User ──< BoardMember >── Board ──< Column ──< Task
                            (owner is also a BoardMember row, role=OWNER)
```

### Ordering strategy

Task and column positions are **floats with midpoint insertion**, not full re-sequencing and not integer gaps. Dropping a task between two existing tasks writes exactly one row — the moved task's `position`, set to the midpoint of its new neighbors — instead of rewriting every sibling on every drag. This is how Trello/Jira-style boards work in production.

The one real failure mode of this approach — float precision exhaustion after many repeated inserts at the exact same slot — is bounded: if two neighbors' positions are closer than `1e-7`, the column is **renormalized** (rewritten to fresh, evenly-spaced positions) inside the same transaction before computing the new position. See `backend/src/common/ordering/position.util.ts` and its unit tests, which explicitly force this path.

**Concurrency.** Moving a task locks its source and destination columns (`SELECT ... FOR UPDATE`, via raw SQL since Prisma has no query-builder support for row locks — isolated in `ColumnLockRepository`) inside a transaction, with both column ids locked in **sorted order** to prevent deadlocks between two concurrent moves touching the same column pair in opposite directions.

**API and edge cases** (`PATCH /boards/:boardId/tasks/:taskId/move`, body `{ destinationColumnId, targetIndex }`):
- The source column/board is **re-derived from the task itself** — never trusted from the client. The destination column is independently resolved and checked against `:boardId`. A legitimate editor on one board can't move a task into another board's column even by guessing/tampering with an id.
- `targetIndex` out of range is **clamped** into `[0, columnLength]`, not rejected — negative values clamp to the start, overflow clamps to the end.
- A malformed (non-integer) `targetIndex` or a `destinationColumnId` that doesn't exist/doesn't belong to the board is rejected (`400`/`404`).
- Dropping a task back at its current position is detected as a no-op and skips the write entirely.

### Authorization model

| Operation | VIEWER | EDITOR | OWNER |
|---|:---:|:---:|:---:|
| Read board / columns / tasks / members | ✓ | ✓ | ✓ |
| Update board title/description | | ✓ | ✓ |
| Delete board | | | ✓ |
| Create/update/delete columns | | ✓ | ✓ |
| Create/update/delete/move tasks | | ✓ | ✓ |
| Add/change-role/remove members | | | ✓ |

Only an OWNER manages membership — the brief doesn't specify who can share a board, and restricting it to the owner is the simpler, more defensible default.

Enforcement is layered:
1. **`JwtAuthGuard`** (global) authenticates every request except `@Public()` routes (register/login).
2. **`BoardMembershipGuard`** resolves `:boardId` from the route, confirms the caller is a member, and — only on routes annotated `@RequireRole(...)` — checks their role meets the minimum. Routes without that decorator require membership only, which is how reads stay open to VIEWER while mutations gate on EDITOR/OWNER. A non-member gets `404` rather than `403` on a board they can't see, so they can't use the response to probe which board ids exist.
3. **Service-level ownership checks** close the gap a route guard can't: a guard only ever sees `:boardId` from the URL, never a task/column id from the body. Every service that receives a task or column id independently verifies it belongs to the board in the URL before touching it (`getColumnInBoardOrThrow`, `getTaskInBoardOrThrow`) — this is what stops a valid editor on Board A from mutating a resource that actually belongs to Board B.

A board is also guaranteed to always keep at least one OWNER — demoting or removing the last owner is rejected.

---

## Testing

```
cd backend
npm test          # unit tests (ordering algorithm)
npm run test:e2e  # integration tests (auth, authorization matrix, ordering, IDOR)
```

`npm run test:e2e` runs against a separate database (`backend/.env.test`, database name `kanban_test`) so it never touches your development data. Coverage includes:

- **Authorization**: VIEWER can read but not mutate; EDITOR can mutate content but not manage membership; OWNER can do everything; non-members are rejected; a task/column belonging to one board cannot be read, mutated, or moved into via another board's routes.
- **Ordering**: same-column reorder, cross-column move to the start/middle/end, moving into an empty column, moving to the current position (no-op), out-of-range index clamping, malformed input rejection, and a forced renormalization pass with an assertion that the resulting positions are still strictly increasing and distinct.

## API overview

All routes except `/health`, `/auth/register`, `/auth/login` require `Authorization: Bearer <token>`. Full interactive docs at `/docs` (Swagger) once the backend is running.

```
POST   /auth/register
POST   /auth/login

GET    /boards
POST   /boards
GET    /boards/:boardId
PATCH  /boards/:boardId
DELETE /boards/:boardId
GET    /boards/:boardId/members
POST   /boards/:boardId/members
PATCH  /boards/:boardId/members/:memberId
DELETE /boards/:boardId/members/:memberId

GET    /boards/:boardId/columns
POST   /boards/:boardId/columns
PATCH  /boards/:boardId/columns/:columnId
DELETE /boards/:boardId/columns/:columnId

GET    /boards/:boardId/tasks
POST   /boards/:boardId/tasks
PATCH  /boards/:boardId/tasks/:taskId
DELETE /boards/:boardId/tasks/:taskId
PATCH  /boards/:boardId/tasks/:taskId/move
```

---

## Deployment

**Live:**
- Frontend: https://mini-kanban-board-frontend.vercel.app
- Backend API: https://mini-kanban-board-backend.vercel.app (health check at `/health`, Swagger at `/docs`)
- Database: Neon Postgres

Everything above works fully containerized (`docker compose up --build`) and needs no code changes to deploy — only environment variables.

- **Database**: any managed Postgres works (Neon, Supabase, RDS, Render Postgres, ...). If it's a pooled connection (e.g. Neon's pgbouncer endpoint), set `DATABASE_URL` to the pooled connection string and `DIRECT_URL` to the unpooled one — Prisma uses `DIRECT_URL` only for running migrations.
- **Backend**: the `Dockerfile` in `backend/` works as-is on any container platform that builds from a Dockerfile (Render, Fly.io, Railway, ...). It also ships a Vercel-serverless entrypoint (`backend/api/index.ts` + `backend/vercel.json`) if you'd rather deploy it as serverless functions — `vercel deploy` from `backend/` picks it up with no further configuration.
- **Frontend**: standard Next.js app — deploys to Vercel with zero config (`vercel deploy` from `frontend/`, with `NEXT_PUBLIC_API_URL` set to the deployed backend's URL at build time), or via the included Dockerfile anywhere else.

Set `CORS_ORIGIN` on the backend to the deployed frontend's origin once both are live.

## Known limitations / deliberate scope decisions

- JWT access tokens only (7-day expiry), no refresh-token rotation — reasonable for this scope, would add rotation + revocation storage for production use.
- Column reordering (drag columns themselves) isn't implemented — only task movement is required by the brief; tasks are the graded ordering surface.
- No real-time sync between simultaneous viewers of the same board (no WebSockets) — each client reflects its own actions immediately and reconciles with the server on every mutation, but won't see another user's change until it refetches.
