# Subscription-Manager Testing Guide

## Local Testing

### Prerequisites
- Docker & Docker Compose installed
- Access to server or local machine

### Quick Test (Local)

```bash
# 1. Build images
cd Subscription-Manager
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. Test health endpoint
curl http://localhost:3001/api/health

# Expected: {"status":"ok","timestamp":"...","uptime":...}

# 5. Test database connection
docker-compose exec db pg_isready -U subscription

# 6. View logs
docker-compose logs -f backend
```

### Full Checklist

| Test | Command | Expected |
|------|---------|----------|
| Backend health | `curl http://localhost:3001/api/health` | 200 OK |
| Swagger docs | `curl http://localhost:3001/api/docs` | HTML page |
| Database | `docker-compose exec db psql -U subscription -c "SELECT 1"` | 1 |
| Frontend | `curl http://localhost:3000` | React app |
| Network | `docker network ls` | subscription_network |
| Volumes | `docker volume ls` | postgres_data |

## Deployment Test (Oracle Cloud / Server)

After deployment via app-deploy:

```bash
# 1. Check containers running
docker-compose -f docker-compose.yml ps

# 2. Test health from server
curl http://localhost:3001/api/health
curl http://<server-ip>/api/health

# 3. Test through nginx (app-deploy)
curl http://<server-ip>/api/health
curl http://<server-ip>/

# 4. Check logs
docker-compose logs -f

# 5. Check resource usage
docker stats
```

## API Endpoints Test

```bash
# Base URL
BASE_URL=http://localhost:3001/api

# 1. Register new user
curl -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'

# 2. Login
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'

# Save accessToken for subsequent tests
TOKEN="<access-token>"

# 3. Get subscriptions
curl $BASE_URL/subscriptions -H "Authorization: Bearer $TOKEN"

# 4. Create subscription
curl -X POST $BASE_URL/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Netflix",
    "amount":599,
    "billingCycle":"monthly",
    "nextBillingDate":"2025-02-01"
  }'

# 5. Analytics
curl $BASE_URL/analytics/monthly-spend -H "Authorization: Bearer $TOKEN"
```

## Production Test Checklist

| Item | Test | Pass Criteria |
|------|------|---------------|
| Backend health | `curl /api/health` | 200 OK |
| Response time | `time curl /api/health` | < 200ms |
| No stack trace | `curl /api/auth/login` | No error details |
| CORS | Check headers | Origin in response |
| Database | Check connection | pg_isready OK |
| Restart | `docker-compose restart` | Clean restart |
| Logs | `docker-compose logs` | No errors |
| Memory | `docker stats` | < 512MB |
| CPU | `docker stats` | < 10% idle |

## Troubleshooting

### Container won't start
```bash
docker-compose logs backend
docker-compose exec backend sh
```

### Database connection failed
```bash
docker-compose exec db psql -U subscription -c "SELECT 1"
docker-compose exec backend ping db
```

### Health check fails
```bash
docker inspect subscription_backend | grep -A 10 Health
```

### Need to reset
```bash
docker-compose down -v
docker-compose up -d --build
```