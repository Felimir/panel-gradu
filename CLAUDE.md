# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Panel Gradu is a graduation management platform (Spanish-language UI) for tracking student fees, raffles, finances, and operations. Built for "Gradu 63" committee coordinators.

## Architecture

- **Backend**: Express.js (Node 20, CommonJS) — plain JavaScript, no TypeScript, no ORM
- **Frontend**: React 19 + Vite 8 (ESM) — plain JavaScript with JSX
- **Database**: MariaDB 10.11 with raw SQL queries via `mariadb` driver
- **Auth**: JWT stored in localStorage, bcrypt password hashing
- **Deployment**: Docker Compose (dev), Traefik reverse proxy (prod at `gradu.hxl.red`)

## Common Commands

```bash
# Start all services (db, backend, frontend, phpmyadmin)
docker-compose up -d --build

# Seed database (creates tables, classes, default admin user)
docker exec -it panel_gradu_backend node src/db/seed.js

# Frontend lint
docker exec -it panel_gradu_frontend npx eslint .
# Or locally: cd frontend && npm run lint

# Frontend build
cd frontend && npm run build
```

No test framework is configured. Backend has no linting setup.

## Local Access

| Service    | URL                    |
|------------|------------------------|
| Frontend   | http://localhost:5173  |
| Backend    | http://localhost:3000  |
| Healthcheck| http://localhost:3000/health |
| phpMyAdmin | http://localhost:8080  |

Default admin: cedula `12345678`, password `admin123`

## Project Structure

```
backend/src/
  index.js              # Express entry point, mounts all /api/* routes
  db/connection.js      # MariaDB connection pool
  db/schema.sql         # All table definitions
  db/seed.js            # DB initialization script
  middlewares/authMiddleware.js  # JWT verify + isAdmin middleware
  routes/               # One file per domain (auth, users, students, fees, raffles, finances, dashboard, classes)

frontend/src/
  App.jsx               # Route definitions + ProtectedRoute wrapper
  layouts/AdminLayout.jsx  # Sidebar + header shell (glassmorphic dark theme)
  pages/                # One page component per route
  services/api.js       # fetchWithAuth() — adds JWT header, handles 401 globally
```

## API Structure

All routes under `/api`. Auth required unless noted:
- `/api/auth` — login (public), session validation
- `/api/users` — staff CRUD (admin only)
- `/api/classes` — class listing
- `/api/students` — student CRUD with filters, soft delete (admin)
- `/api/fees` — monthly fee config (admin) + payment matrix
- `/api/raffles` — raffle summary, history, transactions with automatic fee application
- `/api/finances` — manual income/expense ledger
- `/api/dashboard` — aggregated analytics and metrics

## Key Conventions

- **All monetary amounts are INT** (Uruguayan pesos, no decimals)
- **Soft deletes** via `deleted_at TIMESTAMP NULL` on students table
- **DB pattern**: get connection from pool, try/catch/finally with `conn.release()`
- **Error messages are in Spanish** to match the UI
- **Raffle pricing**: fixed at $100/ticket; proceeds apply to current month fee first, surplus goes to common fund
- **Payment methods**: `cash` or `transfer`
- **User roles**: `admin`, `organizer`, `student` (student portal not yet implemented)
- **Frontend state**: local `useState` only, no global state library
- **Notifications**: `react-hot-toast`
- **Icons**: `lucide-react`
- **Charts**: `recharts`

## Environment Variables

Copy `.env.example` to `.env`. Key vars: `DB_ROOT_PASSWORD`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`, `VITE_API_URL`.

## Database Schema (8 tables)

`classes` → `users` → `organizer_classes` (many-to-many) → `students` → `payments` (linked to `monthly_fee_config`) → `raffle_logs` → `transactions`

See `backend/src/db/schema.sql` for full definitions. The `roadmap.md` file contains detailed business rules and the module-by-module implementation plan.
