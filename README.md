# Task Management Platform

Full-stack task management system built for the technical assessment.

**Stack:** Node.js (Express) · Vue 3 (Vite) · PostgreSQL (Sequelize) · Socket.IO

## Features

- JWT authentication (login / logout / me)
- Task CRUD with pagination, filtering, sorting
- File attachments stored on **filesystem**; database stores **AES-256-GCM encrypted paths** only
- Video streaming with HTTP range requests (MP4, WebM)
- Real-time updates via WebSocket (tasks, comments, presence, typing)
- Background job queue (email simulation, bulk updates, exports, virus scan simulation)
- Image thumbnail generation (Sharp)
- Responsive Vue dashboard with drag-and-drop uploads

## Project structure

```
├── backend/          # Express API + Sequelize
├── frontend/         # Vue 3 SPA
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Database

```sql
CREATE DATABASE task_management;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials and secrets
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

API: `http://localhost:3000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173` (if that port is busy, Vite may use `5174` — both are allowed by the API CORS config)

**Socket.IO:** The frontend connects through the Vite proxy (`/socket.io` → port 3000). Do not point the client directly at `localhost:3000` during local dev unless you set `VITE_SOCKET_URL` and configure CORS.

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | password123 | admin |
| bob@example.com | password123 | manager |
| carol@example.com | password123 | member |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/users` | Search users (`?search=name`, `?limit=15`) for assignee picker |
| GET | `/api/tasks` | List tasks (query: page, limit, status, priority, search, sortBy, sortOrder) |
| GET | `/api/tasks/:id` | Task detail with attachments & comments |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/attachments` | Upload file (multipart `file`) |
| GET | `/api/attachments/:id/download` | Download attachment |
| GET | `/api/attachments/:id/stream` | Stream video (`Authorization` or `?token=`) |
| DELETE | `/api/attachments/:id` | Delete attachment |
| GET | `/api/tasks/:taskId/comments` | List comments |
| POST | `/api/tasks/:taskId/comments` | Add comment |

## Encrypted file paths

Files are saved under `backend/uploads/{taskId}/{uuid}/`. Only an encrypted token is stored in `task_attachments.file_path` using AES-256-GCM and `PATH_ENCRYPTION_KEY` from `.env`.

## Base URL (`BACK_END_DEFAULT_URL`)

Mount the API under a path prefix (e.g. for nginx or PM2 behind `/task-management-api`).

**Backend** (`.env`):

```env
# Full URL (recommended for production logs)
BACK_END_DEFAULT_URL=http://localhost:3000/task-management-api

# Or path only (uses PORT for the host in logs)
BACK_END_DEFAULT_URL=/task-management-api
```

| Setting | Result |
|---------|--------|
| REST | `{base}/api/*` → e.g. `http://localhost:3000/task-management-api/api/tasks` |
| Health | `{base}/api/health` |
| Socket.IO | `{base}/socket.io` |

**Frontend** (`.env` — Vite requires the `VITE_` prefix):

```env
# UI at https://residex.site/task-management/
VITE_APP_BASE_PATH=/task-management

# API at https://residex.site/task-management-api/api/...
VITE_BACK_END_DEFAULT_URL=/task-management-api
VITE_BACKEND_TARGET=http://localhost:3000
```

| Path | Purpose |
|------|---------|
| `/task-management/` | Vue app (Vite `base` / `VITE_APP_BASE_PATH`) |
| `/task-management-api/` | Node API + Socket.IO |

**Nginx (frontend static build):**

```nginx
location = /task-management {
    return 301 /task-management/;
}
location /task-management/ {
    alias /var/www/task-management/dist/;  # output of npm run build
    try_files $uri $uri/ /task-management/index.html;
}
```

Restart both servers after changing env vars.

### Nginx (important)

Your current config **strips** the `/task-management-api` prefix:

```nginx
# WRONG for this app (sends /api/... to Node, but Node expects /task-management-api/api/...)
proxy_pass http://127.0.0.1:3000/;
```

**Option A — Keep `BACK_END_DEFAULT_URL=/task-management-api` (recommended)**  
Forward the **full path** to Node:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

location /task-management-api/ {
    proxy_pass http://127.0.0.1:3000/task-management-api/;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /task-management-api {
    return 301 /task-management-api/;
}
```

**Option B — Strip prefix in nginx (your current setup)**  
Use `proxy_pass http://127.0.0.1:3000/;` and **do not** set `BACK_END_DEFAULT_URL` on the server.

```env
PUBLIC_BASE_PATH=/task-management-api
```

Node serves `/api/*`; nginx maps public `/task-management-api/api/*` → `/api/*`.  
`GET /` on Node answers `https://residex.site/task-management-api/` (after redirect).

Add nginx redirect for URLs without trailing slash:

```nginx
location = /task-management-api {
    return 301 /task-management-api/;
}
```

## Environment variables

See `backend/.env.example` and `frontend/.env.example` for all options.
