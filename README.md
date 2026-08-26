# Remote Office Portal — Phase 1.1

A full-stack foundation for a remote-office administration system. This phase includes JWT authentication, employees, RBAC permissions, audit logs, dashboard reporting, and a responsive application shell. Attendance, breaks, leave, salary, payroll, and reports are intentionally reserved for later migrations.

## Prerequisites

- Node.js 20+
- npm 10+
- MySQL 8+

## Setup

```bash
git clone <repository-url> remote-office-portal
cd remote-office-portal
npm install
mysql -u root -p -e "CREATE DATABASE remote_office_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` with your MySQL credentials and a random JWT secret of at least 32 characters. Then apply the schema and seed from the repository root:

```bash
mysql -u root -p remote_office_portal < database/migrations/001_initial_schema.sql
mysql -u root -p remote_office_portal < database/seed.sql
```

Start both applications:

```bash
npm run dev
```

Or start them separately:

```bash
npm run dev -w server
npm run dev -w client
```

Open `http://localhost:5173`. Development login: `ceo@example.com` / `ChangeMe123!`. Change this password before any shared or production deployment.

## Useful commands

```bash
npm run build
npm run start
curl http://localhost:4000/health
```

API endpoints are rooted at `/api/v1`. See [architecture](docs/architecture.md), [database](docs/database.md), and [roles and permissions](docs/roles-permissions.md) for implementation details.
