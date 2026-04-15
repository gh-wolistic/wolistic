# Admin Panel Login Guide

## Quick Start

1. **Start the admin panel:**
   ```bash
   cd wolistic-admin
   npm run dev
   ```

2. **Navigate to login page:**
   ```
   http://localhost:3001
   ```
   (This will automatically redirect to the login page)

3. **Login credentials:**
   - **Email:** `admin@wolistic.com` (or your configured `ADMIN_EMAIL` from backend `.env`)
   - **Password:** Any non-empty password (development mode accepts any password)

4. **After login:**
   - You'll be redirected to `/dashboard`
   - Session is active for 24 hours
   - Refresh the page anytime - your session persists

---

## How Authentication Works

### Session-Based Auth Flow

1. **Login Request:**
   - Frontend sends POST to `/api/v1/admin/login` with email + password
   - Backend validates email matches `ADMIN_EMAIL` from environment
   - Backend creates session and sets `admin_session` cookie (HttpOnly, 24h expiry)

2. **Protected Routes:**
   - All `/dashboard/*` routes check authentication on mount
   - Frontend calls GET `/api/v1/admin/session` to verify session
   - If valid: Show dashboard with user email
   - If invalid: Redirect to `/login`

3. **API Requests:**
   - All admin API calls use `credentials: "include"` to send session cookie
   - Backend `require_admin_session` dependency validates cookie on each request

### Session Persistence

- Session stored in backend memory (in-memory dict for development)
- Cookie expires in 24 hours
- Survives page refresh and browser restart (if cookie not cleared)

**Production TODO:** Replace in-memory sessions with Redis or database-backed storage.

---

## Troubleshooting

### "Not authenticated" error on dashboard

**Symptom:** Console shows `Not authenticated` error, page redirects to login.

**Cause:** No active session cookie (expected behavior).

**Solution:** 
1. Navigate to `http://localhost:3001/login`
2. Enter admin credentials
3. Click "Sign In"

---

### Session not persisting after login

**Potential causes:**
1. **Browser blocking cookies:** Check browser console for cookie warnings
2. **CORS issues:** Ensure backend `.env` has:
   ```env
   BACKEND_CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
   ```
3. **Backend not running:** Verify `docker ps` shows backend container healthy
4. **Port mismatch:** Admin panel must be on 3001 (not 3000)

**Fix:**
- Clear browser cookies for `localhost:3001`
- Restart backend: `docker restart backend`
- Verify CORS config in `backend/app/core/config.py`

---

### "Invalid admin credentials" error

**Cause:** Email doesn't match backend `ADMIN_EMAIL` setting.

**Solution:**
1. Check backend `.env` file:
   ```env
   ADMIN_EMAIL=admin@wolistic.com
   ```
2. Use exact email (case-insensitive)
3. In development, any password works (just can't be empty)

---

### Session expires too quickly

**Cause:** Cookie `max_age` is 24 hours by default.

**Solution (development):**
Edit `backend/app/api/routes/admin.py` line 118:
```python
max_age=86400 * 7,  # 7 days instead of 1 day
```

Restart backend:
```bash
docker restart backend
```

---

## Development Notes

### Session Storage

Current implementation uses in-memory Python dict:
```python
_active_sessions: dict[str, str] = {}  # session_id -> admin_email
```

**Limitations:**
- Sessions lost on backend restart
- Not suitable for multi-instance deployment
- No automatic cleanup of expired sessions

**Production upgrade path:**
1. Replace with Redis session store
2. Use JWT tokens with refresh mechanism
3. Store sessions in PostgreSQL with TTL

---

### Password Validation

**Current (development):**
```python
if not payload.password:
    raise HTTPException(401, "Invalid admin credentials")
```

**Production TODO:**
1. Hash passwords with bcrypt/argon2
2. Store admin users in `users` table
3. Implement rate limiting (max 5 attempts per 15 minutes)
4. Add 2FA/MFA support

---

### Cookie Settings

**Current settings:**
```python
response.set_cookie(
    key="admin_session",
    value=session_id,
    httponly=True,      # Prevent XSS access
    secure=False,       # Set to True in production (HTTPS only)
    samesite="lax",     # CSRF protection
    max_age=86400,      # 24 hours
)
```

**Production checklist:**
- [ ] Set `secure=True` (requires HTTPS)
- [ ] Add `domain` parameter for subdomain sharing
- [ ] Consider `samesite="strict"` for enhanced security
- [ ] Implement CSRF tokens for state-changing operations

---

## Testing Login Flow

### Manual Test

```bash
# 1. Check session endpoint (should return 401)
curl http://localhost:8000/api/v1/admin/session

# 2. Login (replace with your admin email)
curl -X POST http://localhost:8000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@wolistic.com","password":"test123"}' \
  -c cookies.txt

# 3. Check session with cookie (should return 200)
curl http://localhost:8000/api/v1/admin/session -b cookies.txt

# 4. Test protected endpoint
curl http://localhost:8000/api/v1/admin/offers -b cookies.txt
```

### Browser Test

1. Open DevTools → Application → Cookies
2. Navigate to `http://localhost:3001`
3. Login with admin credentials
4. Check for `admin_session` cookie:
   - **Name:** `admin_session`
   - **Value:** Random token (32 chars)
   - **Domain:** `localhost`
   - **Path:** `/`
   - **Expires:** 24 hours from now
   - **HttpOnly:** ✓
   - **Secure:** ✗ (dev only)
   - **SameSite:** Lax

---

## Quick Reference

### Admin Panel URLs

- **Login:** `http://localhost:3001/login`
- **Dashboard:** `http://localhost:3001/dashboard`
- **Professionals:** `http://localhost:3001/dashboard/professionals`
- **Offers:** `http://localhost:3001/dashboard/offers`
- **Coins:** `http://localhost:3001/dashboard/coins`

### Backend Endpoints

- **Login:** `POST /api/v1/admin/login`
- **Session Check:** `GET /api/v1/admin/session`
- **Logout:** `POST /api/v1/admin/logout`
- **Offers API:** `GET /api/v1/admin/offers`
- **Professionals API:** `GET /api/v1/admin/professionals`

### Environment Variables

**Backend (`backend/.env`):**
```env
ADMIN_EMAIL=admin@wolistic.com
BACKEND_CORS_ORIGINS=http://localhost:3001,http://127.0.0.1:3001
```

**Frontend (`wolistic-admin/.env.local`):**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Security Best Practices (Production)

1. **Strong Password Policy:**
   - Minimum 12 characters
   - Mix of upper/lower/numbers/symbols
   - Hash with bcrypt (cost factor ≥12)

2. **Rate Limiting:**
   - Max 5 login attempts per 15 minutes per IP
   - Lock account after 10 failed attempts in 1 hour

3. **Session Management:**
   - Rotate session ID on privilege change
   - Invalidate all sessions on password change
   - Store sessions in Redis with TTL

4. **HTTPS Only:**
   - Set `secure=True` on cookies
   - Use HSTS headers
   - Redirect HTTP → HTTPS

5. **Audit Logging:**
   - Log all login attempts (success/failure)
   - Log all admin actions with timestamp + IP
   - Alert on suspicious patterns

6. **Two-Factor Authentication:**
   - TOTP (Google Authenticator, Authy)
   - SMS fallback
   - Backup codes

---

## Common Workflows

### First-Time Setup

```bash
# 1. Start backend
cd backend
docker-compose up -d

# 2. Start admin panel
cd ../wolistic-admin
npm install
npm run dev

# 3. Open browser
open http://localhost:3001

# 4. Login
Email: admin@wolistic.com
Password: (any non-empty string)

# 5. Create first offer
Dashboard → Offers → Create Offer
```

### Daily Usage

```bash
# Start admin panel (backend already running)
cd wolistic-admin
npm run dev

# Navigate to http://localhost:3001
# Login once (session persists for 24h)
# Manage professionals, offers, coins
```

### Logout

```bash
# Option 1: Click logout button in sidebar (when implemented)
# Option 2: Clear cookies manually
# Option 3: Call logout endpoint
curl -X POST http://localhost:8000/api/v1/admin/logout -b cookies.txt
```

---

For offer management documentation, see: [`docs/OFFER_MANAGEMENT.md`](../docs/OFFER_MANAGEMENT.md)
