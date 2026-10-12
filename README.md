<div align="center">
  <img src="assets/banner.svg" alt="Mini Kanban Board banner" width="100%">

  <p><code>Kanban boards with OWNER, EDITOR and VIEWER roles and drag-and-drop ordering that stays correct under concurrent moves</code></p>

  <p>
    <a href="https://mini-kanban-board-frontend.vercel.app"><img src="https://img.shields.io/badge/LIVE_APP-mini--kanban--board--frontend.vercel.app-34d399?style=for-the-badge&logo=vercel&logoColor=0B0E1A&labelColor=0B0E1A" alt="Live app"></a>
    <a href="https://mini-kanban-board-backend.vercel.app/docs"><img src="https://img.shields.io/badge/API_DOCS-SWAGGER-8b7cf6?style=for-the-badge&logo=swagger&logoColor=8b7cf6&labelColor=0B0E1A" alt="Swagger API docs"></a>
    <a href="https://github.com/Saji-d/mini-kanban-board"><img src="https://img.shields.io/badge/SOURCE-Saji--d%2Fmini--kanban--board-8b7cf6?style=for-the-badge&logo=github&logoColor=8b7cf6&labelColor=0B0E1A" alt="Source code"></a>
    <img src="https://img.shields.io/badge/TESTS-40_PASSING-34d399?style=for-the-badge&labelColor=0B0E1A" alt="40 tests">
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_14-0B0E1A?style=flat-square&logo=nextdotjs&logoColor=8b7cf6" alt="Next.js">
    <img src="https://img.shields.io/badge/NestJS-0B0E1A?style=flat-square&logo=nestjs&logoColor=8b7cf6" alt="NestJS">
    <img src="https://img.shields.io/badge/TypeScript-0B0E1A?style=flat-square&logo=typescript&logoColor=8b7cf6" alt="TypeScript">
    <img src="https://img.shields.io/badge/Prisma-0B0E1A?style=flat-square&logo=prisma&logoColor=8b7cf6" alt="Prisma">
    <img src="https://img.shields.io/badge/PostgreSQL-0B0E1A?style=flat-square&logo=postgresql&logoColor=8b7cf6" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Tailwind-0B0E1A?style=flat-square&logo=tailwindcss&logoColor=8b7cf6" alt="Tailwind">
    <img src="https://img.shields.io/badge/Docker-0B0E1A?style=flat-square&logo=docker&logoColor=8b7cf6" alt="Docker">
  </p>

  <p>
    <a href="#-overview">Overview</a> · <a href="#-try-it-live">Try it live</a> · <a href="#-highlights">Highlights</a> · <a href="#-preview">Preview</a> · <a href="#-architecture">Architecture</a> · <a href="#-tech-stack">Tech Stack</a> · <a href="#-getting-started">Getting Started</a> · <a href="#-roadmap">Roadmap</a>
  </p>
</div>

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Overview

Mini Kanban Board is a small Kanban app. Users register, create boards, share them with other registered users under an explicit **OWNER, EDITOR and VIEWER** role model and organise work across columns and tasks with drag-and-drop.

It was built for a technical assessment and leans hardest on two things:

1. **Order consistency:** the task-move API stays correct and cheap under concurrent and repeated reordering.
2. **Authorization:** every board, column and task mutation is checked against board membership and role, with defences against cross-board id tampering.

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Try it live

<div align="center">
  <a href="https://mini-kanban-board-frontend.vercel.app/login"><img src="https://img.shields.io/badge/OPEN_THE_LOGIN_PAGE-PICK_A_ROLE_BELOW-34d399?style=for-the-badge&logo=vercel&logoColor=0B0E1A&labelColor=0B0E1A" alt="Open the login page"></a>
</div>

<br>

Three demo accounts share one pre-populated **Demo Board** at every role, so you can compare the permission matrix right away. You can also register your own account, which makes you the OWNER of any board you create.

| Role | Email | Password | What to try |
| :--- | :--- | :--- | :--- |
| **OWNER** | `demo.owner@mini-kanban.app` | `MiniKanbanDemo1!` | Manage members, edit columns and tasks, delete the board |
| **EDITOR** | `demo.editor@mini-kanban.app` | `MiniKanbanDemo1!` | Create, edit and drag tasks. No membership controls |
| **VIEWER** | `demo.viewer@mini-kanban.app` | `MiniKanbanDemo1!` | Read only. Mutation controls are hidden and the API rejects them |

> These are shared demo accounts, so data may be reset. Please do not store anything personal.

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Highlights

<table>
<tr>
<td width="33%" valign="top"><b>Midpoint ordering</b><br>Dropping a task writes one row: the new position is the midpoint of its neighbours. No full re-sequencing.</td>
<td width="33%" valign="top"><b>Row-locked moves</b><br>Moves lock the source and destination columns with <code>SELECT ... FOR UPDATE</code> in sorted order to avoid deadlocks.</td>
<td width="33%" valign="top"><b>Auto renormalisation</b><br>If two positions get closer than <code>1e-7</code> the column is rewritten with even spacing inside the same transaction.</td>
</tr>
<tr>
<td valign="top"><b>Layered authorization</b><br>Global JWT guard, a board membership guard with role checks and service-level ownership checks.</td>
<td valign="top"><b>Cross-board safety</b><br>Task and column ids are verified against the board in the URL, which blocks id tampering across boards.</td>
<td valign="top"><b>Last owner protected</b><br>A board always keeps at least one OWNER. Demoting or removing the last one is rejected.</td>
</tr>
<tr>
<td valign="top"><b>Accessible drag and drop</b><br>Multi-container sortable lists with <code>@dnd-kit</code> and React Query for server state.</td>
<td valign="top"><b>Swagger docs</b><br>Interactive API docs served at <code>/docs</code>.</td>
<td valign="top"><b>40 tests</b><br>14 unit tests for the ordering utility plus 26 end-to-end tests for auth, the authorization matrix and ordering.</td>
</tr>
</table>

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Preview

<div align="center">
  <img src="docs/preview.webp" alt="Mini Kanban Board preview" width="90%">
</div>

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Architecture

```mermaid
flowchart LR
  UI["Next.js 14<br>dnd-kit and React Query"] -->|"Bearer JWT"| G1
  subgraph API["NestJS API"]
    G1["JwtAuthGuard"] --> G2["BoardMembershipGuard<br>RequireRole"]
    G2 --> SV["Boards, Columns, Tasks services<br>ownership checks"]
    SV --> OR["Ordering engine<br>position.util"]
    SV --> LK["ColumnLockRepository<br>FOR UPDATE"]
  end
  SV --> PR["Prisma"]
  OR --> PR
  LK --> PR
  PR --> DB[("PostgreSQL")]
```

**Data model:** `User` to `Board` to `Column` to `Task`, plus a `BoardMember` join table with a `role`. The owner is also a `BoardMember` row with role `OWNER`, so every authorization check is one uniform membership lookup.

**Moving a task** (`PATCH /boards/:boardId/tasks/:taskId/move` with `destinationColumnId` and `targetIndex`):

```mermaid
sequenceDiagram
  participant C as Client
  participant S as TasksService
  participant DB as PostgreSQL
  C->>S: move(taskId, destinationColumnId, targetIndex)
  S->>DB: begin transaction
  S->>DB: lock source and destination columns (sorted ids)
  S->>S: derive source from the task, check destination belongs to board
  S->>S: clamp targetIndex, renormalise if gap below 1e-7
  S->>DB: write one position (midpoint of neighbours)
  S->>DB: commit
  S-->>C: updated task
```

<details>
<summary><b>Authorization matrix</b></summary>

| Operation | VIEWER | EDITOR | OWNER |
| :--- | :---: | :---: | :---: |
| Read board, columns, tasks and members | ✓ | ✓ | ✓ |
| Update board title and description | | ✓ | ✓ |
| Delete board | | | ✓ |
| Create, update and delete columns | | ✓ | ✓ |
| Create, update, delete and move tasks | | ✓ | ✓ |
| Add, change role and remove members | | | ✓ |

A non-member receives `404` rather than `403` for a board they cannot see, so responses cannot be used to probe which board ids exist.

</details>

<details>
<summary><b>API overview</b></summary>

All routes except `/health`, `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

```text
POST   /auth/register
POST   /auth/login
GET    /boards                      POST   /boards
GET    /boards/:boardId             PATCH  /boards/:boardId      DELETE /boards/:boardId
GET    /boards/:boardId/members     POST   /boards/:boardId/members
PATCH  /boards/:boardId/members/:memberId    DELETE /boards/:boardId/members/:memberId
GET    /boards/:boardId/columns     POST   /boards/:boardId/columns
PATCH  /boards/:boardId/columns/:columnId    DELETE /boards/:boardId/columns/:columnId
GET    /boards/:boardId/tasks       POST   /boards/:boardId/tasks
PATCH  /boards/:boardId/tasks/:taskId        DELETE /boards/:boardId/tasks/:taskId
PATCH  /boards/:boardId/tasks/:taskId/move
```

</details>

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Tech Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| Frontend | Next.js 14 App Router, React, TypeScript, Tailwind CSS | Auth pages, boards list and Kanban view |
| Interaction | `@dnd-kit`, TanStack React Query | Drag and drop and server state |
| Backend | NestJS, TypeScript, class-validator DTOs | REST API with guards and Swagger |
| Database | PostgreSQL, Prisma | Relational model with migrations |
| Testing | Jest, Supertest | Unit and end-to-end suites on a separate test database |
| Delivery | Docker Compose, Vercel, Neon Postgres | Local stack and live deployment |

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Getting Started

**Prerequisites:** Docker, or Node.js 20 or newer with PostgreSQL 14 or newer.

Quick start with Docker:

```bash
git clone https://github.com/Saji-d/mini-kanban-board.git
cd mini-kanban-board
cp .env.example .env
docker compose up --build
# frontend http://localhost:3000, API http://localhost:3001, Swagger /docs
```

The backend container runs `prisma migrate deploy` on startup, so the schema is created for you.

<details>
<summary><b>Manual setup without Docker</b></summary>

```bash
# backend
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy
npm run start:dev          # http://localhost:3001

# frontend (second terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

Backend variable names: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`. Frontend: `NEXT_PUBLIC_API_URL`.

</details>

Run the tests from `backend/`:

```bash
npm test             # unit tests for the ordering utility
npm run test:e2e     # auth, authorization matrix, ordering (uses the kanban_test database)
```

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Project Structure

<details>
<summary><b>Show the tree</b></summary>

```text
mini-kanban-board/
├── backend/
│   ├── prisma/            # schema and migrations
│   ├── src/
│   │   ├── auth/  boards/  columns/  tasks/  users/
│   │   └── common/        # guards, decorators, ordering/position.util
│   └── test/              # e2e suites
├── frontend/
│   └── src/
│       ├── app/           # (auth) and (dashboard) route groups
│       ├── features/      # board-detail, boards
│       └── components/ui/
└── docker-compose.yml
```

</details>

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Roadmap

- [x] Role-based sharing with layered authorization
- [x] Concurrency-safe task moves with midpoint ordering
- [ ] Drag-to-reorder for columns (only tasks can be moved today)
- [ ] Refresh-token rotation and revocation (access tokens only, 7-day expiry)
- [ ] Real-time sync between viewers of the same board

<img src="assets/divider.svg" alt="" width="100%">

## ◈ Author

**Sajidur Rahman Sajid**, Full-Stack Developer and AI engineer from Dhaka.

[Portfolio](https://www.sajidur.me) · [LinkedIn](https://www.linkedin.com/in/sajidur-rahman-sajid/) · [GitHub](https://github.com/Saji-d) · [Email](mailto:sajidsajidurrahman99@gmail.com)

<div align="center"><sub>Built for a technical assessment and deployed end to end.</sub></div>
