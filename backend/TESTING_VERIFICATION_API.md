# Manual Testing Guide for Verification Endpoints

## Prerequisites

1. **Backend running**: `http://localhost:8000`
2. **Test professional user**: Create via Supabase Auth or frontend signup
3. **Get professional token**: Login to frontend, copy JWT from browser DevTools
4. **Admin API key**: From your `.env` file

---

## Quick Health Check

```bash
# Test backend is running
curl http://localhost:8000/api/v1/health
```

**Expected**: `{"status":"ok"}`

---

## Professional Endpoints Tests

### 1. Get Verification Status

```bash
curl -X GET http://localhost:8000/api/v1/professionals/me/verification/status \
  -H "Authorization: Bearer YOUR_PROFESSIONAL_TOKEN"
```

**Expected Response**:
```json
{
  "identity_verification": null,
  "credentials": [],
  "identity_verified": false,
  "credentials_count": 0,
  "approved_credentials_count": 0,
  "can_appear_in_search": false,
  "visibility_blockers": ["Identity verification required"]
}
```

---

### 2. Request Upload URL (Identity Document)

```bash
curl -X POST http://localhost:8000/api/v1/professionals/me/verification/upload-url \
  -H "Authorization: Bearer YOUR_PROFESSIONAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bucket": "professional-identity-documents",
    "file_extension": "pdf"
  }'
```

**Expected Response**:
```json
{
  "bucket": "professional-identity-documents",
  "file_path": "USER_ID/20260418_XXXXXX.pdf",
  "expires_at": "2026-04-18T15:30:00Z"
}
```

---

### 3. Submit Identity Verification

```bash
curl -X POST http://localhost:8000/api/v1/professionals/me/verification/identity \
  -H "Authorization: Bearer YOUR_PROFESSIONAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "aadhaar",
    "document_url": "USER_ID/test_aadhaar.pdf"
  }'
```

**Expected Response**:
```json
{
  "user_id": "...",
  "verification_status": "pending",
  "document_type": "aadhaar",
  "submitted_at": "2026-04-18T10:30:00Z",
  "grace_period_expires_at": "2026-04-25T10:30:00Z"
}
```

---

### 4. Get Identity Status

```bash
curl -X GET http://localhost:8000/api/v1/professionals/me/verification/identity \
  -H "Authorization: Bearer YOUR_PROFESSIONAL_TOKEN"
```

---

### 5. Submit Education Credential

```bash
curl -X POST http://localhost:8000/api/v1/professionals/me/verification/credentials \
  -H "Authorization: Bearer YOUR_PROFESSIONAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credential_type": "education",
    "credential_subtype": "bachelors",
    "credential_name": "BSc Nutrition & Dietetics",
    "issuing_organization": "University of Mumbai",
    "issued_date": "2018-05-15",
    "document_url": "USER_ID/test_degree.pdf"
  }'
```

---

### 6. Submit License Credential

```bash
curl -X POST http://localhost:8000/api/v1/professionals/me/verification/credentials \
  -H "Authorization: Bearer YOUR_PROFESSIONAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credential_type": "license",
    "credential_subtype": "medical_council_license",
    "credential_name": "Medical Council License",
    "issuing_organization": "Medical Council of India",
    "issued_date": "2020-01-15",
    "expiry_date": "2027-01-15",
    "license_number": "MCI-TEST-12345",
    "document_url": "USER_ID/test_license.pdf"
  }'
```

---

### 7. Get All Credentials

```bash
curl -X GET http://localhost:8000/api/v1/professionals/me/verification/credentials \
  -H "Authorization: Bearer YOUR_PROFESSIONAL_TOKEN"
```

---

## Admin Endpoints Tests

### 1. Get Verification Queue (All)

```bash
curl -X GET "http://localhost:8000/api/v1/admin/verification/queue?limit=50&offset=0" \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY"
```

**Expected Response**:
```json
{
  "items": [
    {
      "verification_id": "...",
      "verification_type": "identity",
      "professional_id": "...",
      "professional_username": "test_user",
      "professional_name": "Test Professional",
      "document_type": "aadhaar",
      "verification_status": "pending",
      "submitted_at": "2026-04-18T10:30:00Z",
      "days_pending": 0
    }
  ],
  "total_count": 1,
  "pending_identity_count": 1,
  "pending_credential_count": 0,
  "expiring_licenses_count": 0
}
```

---

### 2. Filter Queue by Type

```bash
# Identity verifications only
curl -X GET "http://localhost:8000/api/v1/admin/verification/queue?queue_type=identity&status_filter=pending" \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY"

# Credential verifications only
curl -X GET "http://localhost:8000/api/v1/admin/verification/queue?queue_type=credential&status_filter=pending" \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY"

# Expiring licenses
curl -X GET "http://localhost:8000/api/v1/admin/verification/queue?queue_type=expiring_licenses" \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY"
```

---

### 3. Approve Identity Verification

```bash
curl -X POST http://localhost:8000/api/v1/admin/verification/identity/USER_ID/approve \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Aadhaar verified successfully"
  }'
```

**Replace `USER_ID` with actual user_id from queue.**

---

### 4. Reject Identity Verification

```bash
curl -X POST http://localhost:8000/api/v1/admin/verification/identity/USER_ID/reject \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "Document is unclear. Please upload a higher-resolution scan."
  }'
```

---

### 5. Approve Credential Verification

```bash
curl -X POST http://localhost:8000/api/v1/admin/verification/credential/CREDENTIAL_ID/approve \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Degree verified via university registry"
  }'
```

**Replace `CREDENTIAL_ID` with actual credential ID from queue.**

---

### 6. Reject Credential Verification

```bash
curl -X POST http://localhost:8000/api/v1/admin/verification/credential/CREDENTIAL_ID/reject \
  -H "X-Admin-Key: YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason": "License number does not match registry"
  }'
```

---

## How to Get Test Tokens

### Get Professional Token:

1. Login to frontend as a professional: `http://localhost:3000/auth/login`
2. Open browser DevTools (F12)
3. Go to: **Application** → **Local Storage** → `http://localhost:3000`
4. Find key: `sb-<project-ref>-auth-token`
5. Copy the `access_token` value

### Get Admin API Key:

Open `backend/.env` and copy the `ADMIN_API_KEY` value.

---

## Testing Full Workflow

### Scenario: New Professional Verification

1. **Professional submits identity**:
   ```bash
   # Request upload URL
   curl -X POST http://localhost:8000/api/v1/professionals/me/verification/upload-url \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"bucket": "professional-identity-documents", "file_extension": "pdf"}'
   
   # Submit verification (use file_path from above response)
   curl -X POST http://localhost:8000/api/v1/professionals/me/verification/identity \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"document_type": "aadhaar", "document_url": "FILE_PATH"}'
   ```

2. **Admin reviews**:
   ```bash
   # Get queue
   curl -X GET "http://localhost:8000/api/v1/admin/verification/queue?queue_type=identity" \
     -H "X-Admin-Key: ADMIN_KEY"
   
   # Approve (use user_id from queue)
   curl -X POST http://localhost:8000/api/v1/admin/verification/identity/USER_ID/approve \
     -H "X-Admin-Key: ADMIN_KEY" \
     -H "Content-Type: application/json" \
     -d '{"notes": "Verified"}'
   ```

3. **Professional checks status**:
   ```bash
   curl -X GET http://localhost:8000/api/v1/professionals/me/verification/status \
     -H "Authorization: Bearer TOKEN"
   ```
   
   **Expected**: `identity_verified: true`, `can_appear_in_search: true`

---

## Common Issues

### 401 Unauthorized
- Check token is valid and not expired
- Ensure `Authorization: Bearer TOKEN` header is set
- For admin endpoints, use `X-Admin-Key` header instead

### 404 Not Found
- Verify backend is running on port 8000
- Check endpoint path is correct
- Ensure routes are registered in `app/api/router.py`

### 422 Validation Error
- Check request body matches Pydantic schema
- Ensure all required fields are provided
- For licenses, `expiry_date` is mandatory

### 409 Conflict
- Identity already verified (can't submit twice if approved)
- Duplicate credential (same name + issuer already exists)

---

## Success Criteria

✅ All professional endpoints return 200/201  
✅ Admin queue shows pending verifications  
✅ Approve/reject updates status correctly  
✅ Verification status reflects changes  
✅ Search visibility toggled based on identity verification
