# SubSense - Subscription Manager

A full-stack subscription tracking application built with NestJS (backend) and Next.js 14 (frontend).

## Tech Stack

- **Backend**: NestJS, Prisma, PostgreSQL, JWT Auth
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, ShadCN UI, Recharts

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE subscription_manager;
```

2. Update the connection string in `backend-nest/.env`:

```
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/subscription_manager"
```

3. Run migrations:

```bash
cd backend-nest
npx prisma migrate dev --name init
```

### Backend Setup

```bash
cd backend-nest
npm install
npm run start:dev
```

API runs at `http://localhost:3001/api`

### Frontend Setup

```bash
cd frontend-next
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## API Endpoints

### Auth

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Subscriptions

- `GET /api/subscriptions` - List subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/:id` - Get subscription
- `PATCH /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `POST /api/subscriptions/:id/pause` - Pause subscription
- `POST /api/subscriptions/:id/resume` - Resume subscription
- `GET /api/subscriptions/upcoming` - Upcoming renewals

### Analytics

- `GET /api/analytics/monthly-spend` - Monthly spend
- `GET /api/analytics/category-breakdown` - Category breakdown
- `GET /api/analytics/subscription-stats` - Subscription stats
- `GET /api/analytics/total-monthly-spend` - Total monthly spend

### Payments

- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment

### Detection

- `POST /api/detect/sms` - Detect from SMS
- `POST /api/detect/confirm` - Confirm detection
- `GET /api/detect/logs` - Get detection logs

### Reminders

- `GET /api/reminders/:subscriptionId` - Get reminders
- `POST /api/reminders` - Create reminder
- `DELETE /api/reminders/:id` - Cancel reminder

## Project Structure

```
backend-nest/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── subscription/
│   │   ├── analytics/
│   │   ├── billing/
│   │   ├── detection/
│   │   └── reminder/
│   └── prisma/
│       └── schema.prisma

frontend-next/
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── subscriptions/
│   │   └── analytics/
│   ├── components/ui/
│   └── lib/

deploy/
├── deploy.sh             # Enhanced deployment script with --service option
├── Dockerfile            # Multi-stage build for frontend/backend
├── docker-compose.yml    # Profile-based service deployment
├── nginx.conf            # Custom routing for Subscription-Manager
├── .env                  # Environment variables template
├── scripts/              # Supporting deployment scripts
└── systemd/              # Systemd service templates
```

## Deployment Options

The application supports flexible deployment options using the enhanced deployment system:

### Local Development (Docker Compose)
```bash
cd deploy
docker-compose up                    # Full stack deployment
docker-compose --profile frontend up # Frontend only
docker-compose --profile backend up  # Backend + database
docker-compose --profile db up       # Database only
```

### Production Deployment (Using Enhanced Deploy Script)
```bash
cd deploy
./deploy.sh                          # Full deployment (default)
./deploy.sh --service frontend       # Frontend only
./deploy.sh --service backend        # Backend + database
./deploy.sh --service db             # Database only

# With additional options
./deploy.sh --service frontend --build    # Force rebuild
./deploy.sh --service backend -e staging  # Deploy to staging
./deploy.sh --service frontend -l         # Show logs after deploy
```

### Production Deployment (Using app-deploy Infrastructure)
For Oracle Cloud deployment using the app-deploy infrastructure:

1. Provision infrastructure using app-deploy's Terraform
2. SSH to instance and run setup script
3. Configure environment variables in `/etc/appdeploy/app.production.env`
4. Deploy using the enhanced deploy script:
   ```bash
   sudo ./deploy.sh --service frontend   # Frontend only
   sudo ./deploy.sh --service backend    # Backend + database
   sudo ./deploy.sh                      # Full deployment
   ```

## Deployment Profiles

The deployment system supports three profiles:
- **frontend**: Deploys only the frontend (Next.js) application
- **backend**: Deploys the backend (NestJS) API and database
- **db**: Deploys only the database service

This enables independent frontend deployment without impacting the production database.

## Project Structure

```
backend-nest/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   ├── subscription/
│   │   ├── analytics/
│   │   ├── billing/
│   │   ├── detection/
│   │   └── reminder/
│   └── prisma/
│       └── schema.prisma

frontend-next/
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── subscriptions/
│   │   └── analytics/
│   ├── components/ui/
│   └── lib/

deploy/
├── deploy.sh             # Enhanced deployment script with --service option
├── Dockerfile            # Multi-stage build for frontend/backend
├── docker-compose.yml    # Profile-based service deployment
├── nginx.conf            # Custom routing for Subscription-Manager
├── .env                  # Environment variables template
├── scripts/              # Supporting deployment scripts
└── systemd/              # Systemd service templates
```

## License

MIT
