# Deployment Plan: Subscription-Manager using app-deploy Infrastructure

## Overview
This plan outlines how to adapt the Subscription-Manager application to use the app-deploy deployment infrastructure for Docker-based deployment on Oracle Cloud.

## Current State Analysis

### Subscription-Manager Structure
- Backend: NestJS (backend-nest/) - runs on port 3001
- Frontend: Next.js 14 (frontend-next/) - runs on port 3000
- Database: PostgreSQL
- Deployment: docker-compose.yml at project root

### app-deploy Infrastructure
- Single application deployment model
- nginx reverse proxy routing /api to backend
- Terraform for Oracle Cloud infrastructure
- GitHub Actions CI/CD pipeline
- Systemd service management
- Environment variable management via /etc/appdeploy/

## Key Adaptations Required

### 1. Directory Structure Changes
```
Subscription-Manager/
├── deploy/                 # Add - mirror app-deploy structure
│   ├── Dockerfile          # Multi-stage build for both frontend/backend
│   ├── docker-compose.yml  # Adapted for Subscription-Manager
│   ├── nginx.conf          # Adapted for Subscription-Manager routes
│   ├── scripts/            # Deployment scripts
│   └── systemd/            # Systemd service templates
├── backend-nest/           # Existing NestJS backend
├── frontend-next/          # Existing Next.js frontend
└── ...                     # Other existing files
```

### 2. Dockerfile Adaptation
Need to create a multi-stage Dockerfile that builds both frontend and backend:
- Stage 1: Build backend (NestJS)
- Stage 2: Build frontend (Next.js)
- Stage 3: Production runtime serving both

### 3. docker-compose.yml Adaptation
Modify to work with app-deploy patterns:
- Single service for the combined application
- nginx as reverse proxy (as in app-deploy)
- Proper health checks
- Environment variable handling

### 4. nginx.conf Adaptation
Adjust for Subscription-Manager specific routes:
- /api → backend:3001
- / → frontend (serving static Next.js files)
- Health endpoints at /health, /ready, /metrics

### 5. Environment Variables
Map Subscription-Manager variables to app-deploy format:
- DATABASE_URL
- JWT_SECRET, PORT, CORS_ORIGIN (backend)
- NEXT_PUBLIC_API_URL, NODE_ENV, PORT (frontend)
- PostgreSQL credentials

### 6. Deployment Process
Follow app-deploy patterns:
1. Use setup.sh for server preparation
2. Use deploy.sh for application deployment
3. Environment stored in /etc/appdeploy/app.production.env
4. Systemd service management via app@production.service

## Implementation Steps

### Phase 1: Infrastructure Preparation
1. Fork/apply app-deploy Terraform to Oracle Cloud
2. Provure VM instance
3. SSH to instance and run setup.sh

### Phase 2: Application Adaptation
1. Create deploy/ directory in Subscription-Manager
2. Adapt Dockerfile for dual build
3. Modify docker-compose.yml for app-deploy patterns
4. Adapt nginx.conf for Subscription-Manager routes
5. Copy and adapt deployment scripts
6. Create systemd service templates

### Phase 3: Configuration
1. Set up environment variables in /etc/appdeploy/
2. Configure GitHub secrets for CI/CD
3. Test local deployment with docker-compose

### Phase 4: Deployment
1. Push to main branch to trigger GitHub Actions
2. Or manually deploy using deploy.sh
3. Verify health endpoints and application functionality

## Verification Checklist
- [ ] Application accessible via HTTP
- [ ] API endpoints functional at /api/*
- [ ] Frontend served at root path /
- [ ] Health checks passing (/health, /ready)
- [ ] Database connectivity verified
- [ ] Environment variables properly loaded
- [ ] Logs accessible via journalctl
- [ ] Backup scripts functional
- [ ] Security hardening applied

## Rollback Plan
1. Use systemd to restart previous version
2. Utilize backup scripts if needed
3. Terraform state allows infrastructure rollback
4. Docker images tagged for easy rollback

## Estimated Effort
- Infrastructure setup: 1-2 hours
- Application adaptation: 3-4 hours
- Testing and validation: 2-3 hours
- Documentation: 1 hour

Total: 7-10 hours