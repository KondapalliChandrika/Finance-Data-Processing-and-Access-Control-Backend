# Finance Data Processing and Access Control Backend

A production-quality REST API for a **Finance Dashboard** with JWT authentication, Role-Based Access Control, financial record management, and dashboard analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | express-validator |
| API Docs | Swagger UI (swagger-jsdoc + swagger-ui-express) |

---

## Project Structure

```
src/
├── config/
│   ├── db.js              # PostgreSQL pool + auto schema init
│   └── swagger.js         # Swagger spec config
├── middleware/
│   ├── auth.js            # JWT verification
│   ├── roles.js           # RBAC guard factory
│   └── errorHandler.js    # Global error handler
├── routes/                # Route definitions + Swagger annotations
├── controllers/           # Business logic
└── validators/            # express-validator chains
seed.js                    # Demo data seeder
server.js                  # Entry point
```

---

## Getting Started

### 1. Prerequisites

- Node.js 18+
- PostgreSQL running locally (or any connection string)

### 2. Clone & Install

```bash
git clone <repo-url>
cd "Finance Data Processing and Access Control Backend"
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

`.env` values:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/finance_db
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

### 4. Create the Database

```bash
createdb finance_db
# or via psql: CREATE DATABASE finance_db;
```

### 5. Seed Demo Data

```bash
node seed.js
```

This creates 3 demo users and 84 financial records across 12 months:

| Email | Password | Role |
|---|---|---|
| admin@finance.dev | Password123! | admin |
| analyst@finance.dev | Password123! | analyst |
| viewer@finance.dev | Password123! | viewer |

### 6. Start the Server

```bash
npm start          # production
npm run dev        # development with hot reload (nodemon)
```
---

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user (default role: viewer) |
| POST | `/api/auth/login` | Public | Login — returns JWT token |
| GET | `/api/auth/me` | Any | Get current user profile |

### Users (Admin only)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List users (filter by role/status, paginated) |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update name, role, or status |
| DELETE | `/api/users/:id` | Soft-deactivate user |

### Financial Records

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/api/records` | Admin, Analyst | Create record |
| GET | `/api/records` | Admin, Analyst | List with filters + pagination |
| GET | `/api/records/:id` | Admin, Analyst | Get single record |
| PUT | `/api/records/:id` | Admin, Analyst | Update record |
| DELETE | `/api/records/:id` | Admin only | Soft-delete record |

**Query filters for GET /api/records:**  
`?type=income&category=salary&from=2024-01-01&to=2024-03-31&page=1&limit=20`

### Dashboard Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/summary` | All roles | Total income, expense, net balance |
| GET | `/api/dashboard/by-category` | All roles | Totals per category & type |
| GET | `/api/dashboard/trends` | All roles | Monthly trends (last 12 months) |
| GET | `/api/dashboard/recent` | All roles | Last 10 transactions |

---

## Role-Based Access Control

| Capability | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Dashboard summary | ✅ | ✅ | ✅ |
| Category breakdown | ✅ | ✅ | ✅ |
| Recent activity | ✅ | ✅ | ✅ |
| Monthly trends | ✅ | ✅ | ✅ |
| View raw records (list / single) | ❌ | ✅ | ✅ |
| Create / update records | ❌ | ✅ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

RBAC is enforced via `requireRole(...roles)` middleware applied per-route, completely independent of controller logic.

---

## Error Response Format

All errors return a consistent JSON shape:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [ /* array of field errors for 422 */ ]
}
```

HTTP status codes used:
- `200` / `201` — Success
- `400` — Bad request / logic error
- `401` — Unauthenticated
- `403` — Forbidden (wrong role or inactive account)
- `404` — Not found
- `409` — Conflict (duplicate email)
- `422` — Validation error
- `500` — Internal server error

---

## Assumptions & Design Decisions

1. **Default role on register** — New users get `viewer` role. Admins promote them as needed.
2. **Soft deletes** — Both users and records are never hard-deleted. Users are `inactive`; records have `is_deleted = true`.
3. **Schema auto-initialisation** — Tables are created on startup via `CREATE TABLE IF NOT EXISTS`, no migration tool required.
4. **Password policy** — Minimum 8 chars, at least one uppercase letter and one number.
5. **Trends open to all roles** — Monthly trend data is dashboard-level aggregated data (not raw records), so viewers can also access it. Only raw `/records` endpoints are restricted to Analyst and Admin.
6. **Self-protection** — Admins cannot deactivate or demote their own account.
7. **Amount constraint** — Financial record amounts must be positive; sign is carried by the `type` field.
8. **Category matching** — `GET /api/records?category=` uses `ILIKE` for case-insensitive partial match.

---

## Optional Enhancements Included

- ✅ JWT authentication with expiry
- ✅ Pagination on all list endpoints
- ✅ Soft delete for records and users
- ✅ Swagger UI API documentation
- ✅ Full input validation with descriptive errors
- ✅ Consistent error response format
- ✅ Health check endpoint (`GET /health`)

