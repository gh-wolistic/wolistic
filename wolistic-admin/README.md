# Wolistic Super Admin

Internal admin application for secure platform operations:

- Login-protected super admin access
- Pending professional approval queue
- Approve and suspend actions
- Filter/search across professional status views

## Required Environment Variables

Create a `.env.local` in this folder with:

```bash
ADMIN_DASHBOARD_EMAIL=admin@wolistic.com
ADMIN_DASHBOARD_PASSWORD=replace_with_strong_password
ADMIN_SESSION_SECRET=replace_with_long_random_secret

BACKEND_API_URL=http://localhost:8000
BACKEND_ADMIN_API_KEY=must_match_backend_admin_api_key
```

## Backend Requirement

The backend must expose `/api/v1/admin/*` endpoints and use the same admin key:

```bash
# backend/.env
ADMIN_API_KEY=must_match_backend_admin_api_key
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
