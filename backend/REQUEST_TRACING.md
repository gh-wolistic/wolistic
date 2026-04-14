# Request Tracing & Logging Infrastructure

**Status**: ✅ Implemented (2026-04-14)  
**Environment**: Development-friendly with production readiness

## Overview

Added request ID tracking, environment-based logging, and Prometheus metrics to improve debugging and prepare for production observability.

---

## Features

### 1. Request ID Middleware

Every request now gets a unique identifier for end-to-end tracing.

**How it works**:
- Client can send `X-Request-ID` header (optional)
- Backend generates UUID if not provided
- Request ID stored in `request.state.request_id`
- Returned in `X-Request-ID` response header

**Benefits**:
- Correlate frontend errors with backend logs
- Trace requests across distributed services (future)
- Debug user-reported issues with exact request context

**Example Usage**:
```python
from fastapi import Request

@router.post("/booking/payments/order")
async def create_payment_order(request: Request):
    request_id = request.state.request_id
    logger.info(f"Creating payment order", extra={"request_id": request_id})
```

---

### 2. Environment-Based Logging

**Development** (current): Human-readable colored logs
```
2026-04-14 15:32:10 INFO     [req:a3b4c5d6] app.api.routes.booking: Creating payment order
```

**Production** (future): JSON-structured logs
```json
{"timestamp":"2026-04-14T15:32:10","level":"INFO","logger":"app.api.routes.booking","message":"Creating payment order","request_id":"a3b4c5d6-e7f8-9012-3456-789abcdef012"}
```

**Configuration** (automatic based on `ENVIRONMENT`):
- `development` → Human-readable + colors
- `production` → JSON for log aggregation

---

### 3. Environment-Based CORS

**Development** (current): Permissive for fast iteration
```env
CORS_ALLOW_ALL_METHODS=true
CORS_ALLOW_ALL_HEADERS=true
```

**Production** (future): Restricted for security
```env
CORS_ALLOW_ALL_METHODS=false
CORS_ALLOW_ALL_HEADERS=false
```

When `false`, only allows:
- **Methods**: GET, POST, PUT, DELETE
- **Headers**: Authorization, Content-Type, X-Request-ID, Accept, Accept-Language

---

### 4. Prometheus Metrics

Automatic HTTP metrics collection via `prometheus-fastapi-instrumentator`.

**Metrics Endpoint**: `http://localhost:8000/metrics`

**Tracked Metrics**:
- `http_request_duration_seconds` — Request latency histogram (p50, p95, p99)
- `http_requests_total` — Total request count by method, path, status code
- `http_requests_in_progress` — Active requests currently being handled

**Example Metrics Output**:
```
# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{handler="/api/v1/booking/payments/order",method="POST",status="200",le="0.005"} 12.0
http_request_duration_seconds_bucket{handler="/api/v1/booking/payments/order",method="POST",status="200",le="0.01"} 45.0
http_request_duration_seconds_count{handler="/api/v1/booking/payments/order",method="POST",status="200"} 67.0
http_request_duration_seconds_sum{handler="/api/v1/booking/payments/order",method="POST",status="200"} 2.34
```

**Integration**:
- Ready for Grafana Cloud scraping (production)
- Works locally for `/metrics` endpoint testing (development)
- No external service connection required until production deployment

---

## Configuration

### Development (.env)

```env
ENVIRONMENT=development
CORS_ALLOW_ALL_METHODS=true
CORS_ALLOW_ALL_HEADERS=true
```

### Production (.env.production)

```env
ENVIRONMENT=production
CORS_ALLOW_ALL_METHODS=false
CORS_ALLOW_ALL_HEADERS=false
```

---

## Usage Examples

### Basic Logging with Request Context

```python
import logging
from fastapi import Request

logger = logging.getLogger(__name__)

@router.post("/sensitive-operation")
async def sensitive_operation(request: Request, current_user: AuthenticatedUser):
    # Request ID automatically included in logs via context
    logger.info(
        "Sensitive operation attempted",
        extra={
            "user_id": str(current_user.user_id),
            "operation": "payment_verification",
        }
    )
```

**Development Output**:
```
2026-04-14 15:32:10 INFO     [req:a3b4c5d6] app.api.routes.payment: Sensitive operation attempted
```

**Production Output**:
```json
{"timestamp":"2026-04-14T15:32:10","level":"INFO","logger":"app.api.routes.payment","message":"Sensitive operation attempted","request_id":"a3b4c5d6-e7f8-9012-3456-789abcdef012","user_id":"abc123","operation":"payment_verification"}
```

---

### Error Logging with Request Correlation

```python
@router.post("/booking/payments/verify")
async def verify_payment(request: Request):
    try:
        # ... payment verification logic ...
        logger.info("Payment verified successfully")
    except PaymentVerificationError as e:
        logger.error(
            f"Payment verification failed: {e}",
            exc_info=True,
            extra={"order_id": order_id, "provider": "razorpay"}
        )
        raise HTTPException(status_code=400, detail=str(e))
```

If user reports "payment failed", you can:
1. Get `X-Request-ID` from their browser network tab
2. Search backend logs for that request ID
3. See exact error + stack trace + payment details

---

### Frontend Integration (Optional)

Generate request ID on frontend for full-stack tracing:

```typescript
// lib/api-client.ts
import { v4 as uuidv4 } from 'uuid';

async function apiCall(url: string, options: RequestInit = {}) {
  const requestId = uuidv4();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-Request-ID': requestId,
    },
  });
  
  console.log(`[${requestId}] ${options.method} ${url} → ${response.status}`);
  
  return response;
}
```

Now you can correlate:
- Frontend console logs (`[a3b4c5d6] POST /api/v1/booking/payments/order → 201`)
- Backend logs (`[req:a3b4c5d6] Creating payment order`)
- Error responses (include `X-Request-ID` in error handler)

---

## Migration from Old Setup

**No Breaking Changes**: All changes are additive and environment-aware.

**What changed**:
- ✅ `RequestIDMiddleware` added (transparent)
- ✅ Logging formatter auto-selects based on `ENVIRONMENT`
- ✅ CORS config is environment-aware but **still permissive in dev**

**What stayed the same**:
- Development workflow unchanged
- Logs still readable in terminal
- CORS still allows all methods/headers in dev
- No code changes required in existing routes

---

## Production Deployment Checklist

When ready to deploy to production:

- [ ] Set `ENVIRONMENT=production` in production .env
- [ ] Set `CORS_ALLOW_ALL_METHODS=false`
- [ ] Set `CORS_ALLOW_ALL_HEADERS=false`
- [ ] Configure log aggregation service (CloudWatch, Datadog, etc.)
- [ ] Set up alerts on ERROR/CRITICAL log levels
- [ ] Test CORS with production frontend URL

**Note**: Do NOT deploy to production until payment signature verification and webhook reconciliation are complete.

---

## Future Enhancements (Not Yet Implemented)

- Distributed tracing with OpenTelemetry
- Request ID propagation to database queries
- Rate limiting based on client IP + request patterns
- Circuit breaker for external payment provider calls
- Alert configuration for p95/p99 latency, error rates, payment failures (requires Grafana Cloud integration)

---

## Files Changed

| File | Purpose |
|------|---------|
| `app/core/middleware.py` | Request ID middleware |
| `app/core/logging_config.py` | Environment-based formatters |
| `app/main.py` | Middleware registration + CORS config + Prometheus instrumentation |
| `app/core/config.py` | CORS environment flags |
| `requirements.txt` | Added prometheus-fastapi-instrumentator |
| `.env.example` | Documentation of new settings |

---

## Related Documentation

- [AI_DONT_DELETE_TODO_WORKLIST.md](../../docs/AI_DONT_DELETE_TODO_WORKLIST.md) — Production security roadmap
- [AI_DONT_DELETE_ARCHITECTURE.md](../../docs/AI_DONT_DELETE_ARCHITECTURE.md) — System architecture overview

---

**Questions?** This infrastructure is transparent in development and production-ready when you flip environment variables. No code changes needed to existing routes.
