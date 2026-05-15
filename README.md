# SubKeep — Subscription Manager

[![CI](https://github.com/Drive10/subkeeper/actions/workflows/ci.yml/badge.svg)](https://github.com/Drive10/subkeeper/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![NestJS](https://img.shields.io/badge/Backend-NestJS-ea2845)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-000000)](https://nextjs.org)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2d3748)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-336791)](https://postgresql.org)

Track, manage, and optimize all your subscriptions in one place. Get reminders, smart insights, and take control of your spending.

![Dashboard](./docs/dashboard.png)

## Tech Stack

| Layer          | Technology                                     |
| -------------- | ---------------------------------------------- |
| **Backend**    | NestJS 10, TypeScript, Passport JWT            |
| **Frontend**   | Next.js 14 (App Router), Tailwind CSS, Recharts|
| **Database**   | PostgreSQL 15, Prisma ORM                      |
| **Auth**       | JWT (access + refresh tokens)                  |
| **Testing**    | Jest (backend), Playwright (frontend E2E)      |
| **Deploy**     | Docker Compose                                 |

## Features

- **Dashboard** — Monthly/yearly spend, upcoming renewals, spending trends, category breakdown
- **Subscription CRUD** — Create, read, update, pause, resume, delete subscriptions
- **Analytics** — Category-wise spending, monthly spending trend, top categories
- **Authentication** — Register, login, JWT-based session management
- **Reminders** — Upcoming renewal notifications
- **SMS Detection** — Auto-detect subscriptions from SMS text
- **Payments** — Track payment history per subscription

## Getting Started

### Quick Start (Docker)

```bash
docker compose up -d
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- API Docs (Swagger): http://localhost:3001/api/docs

### Local Development

#### Prerequisites

- Node.js 20+
- PostgreSQL 15
- npm

#### Database

```bash
createdb subscription_manager

cd backend-nest
cp .env.example .env   # edit DATABASE_URL
npx prisma migrate dev --name init
npm run db:seed        # creates demo user + subscriptions
```

#### Backend

```bash
cd backend-nest
npm install
npm run start:dev     # http://localhost:3001
```

#### Frontend

```bash
cd frontend-next
npm install
npm run dev           # http://localhost:3000
```

### Demo Credentials

```
Email:    demo@example.com
Password: password123
```

## API Endpoints

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <token>` except auth routes.

### Auth

| Method | Path               | Description          |
| ------ | ------------------ | -------------------- |
| POST   | `/auth/register`   | Register new user    |
| POST   | `/auth/login`      | User login           |
| POST   | `/auth/refresh`    | Refresh access token |

### Dashboard

| Method | Path         | Description                        |
| ------ | ------------ | ---------------------------------- |
| GET    | `/dashboard` | Stats, spending, renewals, top subs|

### Subscriptions

| Method | Path                         | Description              |
| ------ | ---------------------------- | ------------------------ |
| GET    | `/subscriptions`             | List (supports filters)  |
| POST   | `/subscriptions`             | Create                   |
| GET    | `/subscriptions/:id`         | Get by ID                |
| PATCH  | `/subscriptions/:id`         | Update                   |
| DELETE | `/subscriptions/:id`         | Delete                   |
| POST   | `/subscriptions/:id/pause`   | Pause                    |
| POST   | `/subscriptions/:id/resume`  | Resume                   |
| GET    | `/subscriptions/upcoming`    | Upcoming renewals        |

### Analytics

| Method | Path                          | Description                   |
| ------ | ----------------------------- | ----------------------------- |
| GET    | `/analytics/category-wise`    | Spending grouped by category  |
| GET    | `/analytics/monthly-trend`    | Monthly spending trend (6 mo) |

### Payments / Detection / Reminders

See Swagger docs at `/api/docs` for the full API reference.

## Project Structure

```
subkeeper/
├── backend-nest/                 # NestJS API
│   ├── prisma/
│   │   └── schema.prisma         # Database models
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/             # JWT auth, register, login
│   │   │   ├── subscription/     # CRUD + pause/resume
│   │   │   ├── dashboard/        # Aggregated dashboard data
│   │   │   ├── analytics/        # Category & monthly trend
│   │   │   ├── billing/          # Payments
│   │   │   ├── detection/        # SMS-based detection
│   │   │   ├── notification/     # Renewal reminders
│   │   │   └── reminder/         # Reminder system
│   │   ├── prisma/               # Prisma service (global)
│   │   └── common/               # Filters, interceptors
│   └── jest.config.ts
│
├── frontend-next/                # Next.js 14 App Router
│   ├── src/app/
│   │   ├── (dashboard)/          # Auth-gated routes
│   │   │   ├── dashboard/        # Main dashboard page
│   │   │   ├── analytics/        # Analytics page
│   │   │   ├── subscriptions/    # List, new, edit
│   │   │   └── settings/         # User settings
│   │   ├── login/                # Login page
│   │   └── register/             # Register page
│   ├── src/components/           # UI components (ShadCN)
│   ├── src/lib/
│   │   ├── api.ts                # API client
│   │   └── types.ts              # TypeScript interfaces
│   ├── tests/                    # Playwright E2E tests
│   └── playwright.config.ts
│
├── docker-compose.yml            # Production stack
├── seed.sql                      # DB seed for Docker
└── .github/                      # CI, issue/PR templates
```

## Testing

### Backend (Jest)

```bash
cd backend-nest
npm test                 # Run all unit tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
```

**Test suites:**
- `analytics.service.spec.ts` — 12 tests
- `dashboard.service.spec.ts` — 7 tests
- `subscription.service.spec.ts` — 20 tests

### Frontend (Playwright)

```bash
cd frontend-next
npx playwright test             # Headless
npx playwright test --headed    # Visible browser
npx playwright test --ui        # UI mode
```

**Test files:**
- `auth.spec.ts` — Login, register, form validation
- `dashboard.spec.ts` — Stats cards, charts, navigation
- `analytics.spec.ts` — Spending breakdown, trends
- `subscriptions.spec.ts` — List, filter, CRUD flow

## Deployment

### Docker Compose (Production)

```bash
docker compose build
docker compose up -d
```

Three services: `backend`, `frontend`, `db` (PostgreSQL).

### Environment Variables

| Variable              | Description              | Default                                    |
| --------------------- | ------------------------ | ------------------------------------------ |
| `DATABASE_URL`        | PostgreSQL connection    | `postgresql://subscription:changeme@db:5432/subscription_manager` |
| `JWT_SECRET`          | JWT signing secret       | *required*                                 |
| `NEXT_PUBLIC_API_URL` | API URL for frontend     | `http://localhost:3001/api/v1`             |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
