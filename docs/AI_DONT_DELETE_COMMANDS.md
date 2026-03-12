# Essential Commands Reference

## Backend (FastAPI + Docker)

### Development
```powershell
# Start backend API (detached)
cd backend
docker compose up -d --build

# View logs
docker compose logs -f backend

# Stop backend
docker compose down

# Restart after code changes
docker compose restart backend

# Full rebuild and restart
docker compose down
docker compose up -d --build
```

### Database Migrations
```powershell
cd backend

# Run all pending migrations
docker compose run --rm backend alembic upgrade head

# Create new migration (after model changes)
docker compose run --rm backend alembic revision --autogenerate -m "description"

# Rollback one migration
docker compose run --rm backend alembic downgrade -1

# View migration history
docker compose run --rm backend alembic history

# View current migration
docker compose run --rm backend alembic current
```

### Testing & Debugging
```powershell
cd backend

# Run shell inside container
docker compose run --rm backend /bin/bash

# Run Python REPL in container
docker compose run --rm backend python

# Test database connectivity
docker compose run --rm backend python -c "from app.core.config import get_settings; print(get_settings().DATABASE_URL)"

# Check health endpoint
curl http://localhost:8000/api/v1/healthz
# or
Invoke-WebRequest http://localhost:8000/api/v1/healthz

# Check readiness endpoint
curl http://localhost:8000/api/v1/readyz

# Run backend tests locally
C:/Python313/python.exe -m pytest
```

### Container Management
```powershell
# Remove all containers and volumes
docker compose down -v

# Remove orphaned containers
docker compose down --remove-orphans

# View running containers
docker ps

# View all containers
docker ps -a

# Remove dangling images
docker image prune
```

## Frontend (Next.js)

### Development
```powershell
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Opens at http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Setup

### Backend `.env` Template
```bash
APP_NAME=backend
ENVIRONMENT=development
API_V1_STR=/api/v1
BACKEND_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://<your-project>.supabase.co
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
DATABASE_URL=postgresql+asyncpg://postgres.<project>:<password>@aws-<region>.pooler.supabase.com:6543/postgres?ssl=require
```

### Frontend `.env.local` Template
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
```

## Common Workflows

### Fresh Start (Clean State)
```powershell
# Backend
cd backend
docker compose down -v
docker compose up -d --build
docker compose run --rm backend alembic upgrade head

# Frontend
cd ../frontend
npm install
npm run dev
```

### After Pulling Code Changes
```powershell
# Backend (if Dockerfile or requirements.txt changed)
cd backend
docker compose up -d --build

# Backend (if only .py files changed)
docker compose restart backend

# Frontend
cd frontend
npm install  # if package.json changed
npm run dev
```

### Check System Status
```powershell
# Backend health
curl http://localhost:8000/api/v1/healthz

# Backend readiness
curl http://localhost:8000/api/v1/readyz

# Frontend
# Open browser: http://localhost:3000

# Docker status
docker ps
docker compose logs backend --tail=50
```

## Troubleshooting

### Backend won't start
```powershell
# Check logs
docker compose logs backend

# Rebuild from scratch
docker compose down -v
docker compose up --build

# Verify env file
cat .env  # or Get-Content .env
```

### Migration fails
```powershell
# Check current state
docker compose run --rm backend alembic current

# Rollback and retry
docker compose run --rm backend alembic downgrade -1
docker compose run --rm backend alembic upgrade head

# Check Supabase credentials
docker compose run --rm backend python -c "from app.core.database import engine; import asyncio; asyncio.run(engine.dispose())"
```

### Port conflicts
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process by PID
taskkill /PID <PID> /F

# Or use different port in docker-compose.yml
# ports: "8001:8000"
```

## Quick Reference

| Task | Command |
|------|---------|
| Start backend | `docker compose up -d` |
| Stop backend | `docker compose down` |
| Run migration | `docker compose run --rm backend alembic upgrade head` |
| View logs | `docker compose logs -f backend` |
| Backend shell | `docker compose run --rm backend /bin/bash` |
| Run backend tests | `C:/Python313/python.exe -m pytest` |
| Start frontend | `npm run dev` |
| Health check | `curl http://localhost:8000/api/v1/healthz` |
| Clean restart | `docker compose down -v && docker compose up -d --build` |
