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

## Environment variables

See `backend/.env.example` for all options.
