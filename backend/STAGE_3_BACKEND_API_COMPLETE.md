# Stage 3: Backend API Endpoints - Implementation Complete

## ✅ Files Created

### **1. Schemas** (`app/schemas/verification.py`)
Pydantic models for request/response validation:
- `IdentityVerificationSubmit` - Submit identity document
- `IdentityVerificationOut` - Identity status response
- `CredentialVerificationSubmit` - Submit credential
- `CredentialVerificationOut` - Credential status response
- `VerificationStatusOut` - Combined verification status
- `UploadURLRequest` / `UploadURLResponse` - Upload URL generation
- `AdminVerificationApprove` / `AdminVerificationReject` - Admin actions
- `ProfessionalVerificationQueueItem` - Queue item
- `VerificationQueueResponse` - Admin queue response

### **2. Business Logic** (`app/services/verification.py`)
`VerificationService` class with methods:
- `submit_identity_verification()` - Professional submits identity
- `get_identity_verification()` - Get identity status
- `submit_credential_verification()` - Professional submits credential
- `get_credentials()` - List all credentials
- `get_verification_status()` - Combined status with search visibility
- `admin_approve_identity()` - Admin approves identity
- `admin_reject_identity()` - Admin rejects identity
- `admin_approve_credential()` - Admin approves credential
- `admin_reject_credential()` - Admin rejects credential

### **3. Storage Service** (`app/services/verification_storage.py`)
`VerificationStorageService` class:
- `generate_upload_url()` - Generate upload URL for direct Supabase upload
- `get_signed_download_url()` - Admin document preview
- `delete_document()` - Delete document from storage
- `list_user_documents()` - List professional's documents

### **4. Supabase Client** (`app/core/supabase.py`)
Singleton Supabase client for storage operations

### **5. Professional Routes** (`app/api/routes/verification.py`)
**Prefix:** `/professionals/me/verification`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/identity` | POST | Submit identity document |
| `/identity` | GET | Get identity status |
| `/credentials` | POST | Submit credential |
| `/credentials` | GET | List all credentials |
| `/status` | GET | Get complete verification status |
| `/upload-url` | POST | Generate upload URL |

### **6. Admin Routes** (`app/api/routes/admin_verification.py`)
**Prefix:** `/admin/verification` (requires admin auth)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/queue` | GET | Get verification queue |
| `/identity/{user_id}/approve` | POST | Approve identity |
| `/identity/{user_id}/reject` | POST | Reject identity |
| `/credential/{id}/approve` | POST | Approve credential |
| `/credential/{id}/reject` | POST | Reject credential |

---

## 📋 API Endpoint Details

### **Professional Endpoints**

#### 1. Submit Identity Verification
```http
POST /api/v1/professionals/me/verification/identity
Authorization: Bearer {supabase_jwt}
Content-Type: application/json

{
  "document_type": "aadhaar",
  "document_url": "550e8400-e29b-41d4-a716-446655440000/20260418_153045_a1b2c3d4.pdf"
}
```

**Response:** `IdentityVerificationOut`

#### 2. Submit Credential
```http
POST /api/v1/professionals/me/verification/credentials
Authorization: Bearer {supabase_jwt}
Content-Type: application/json

{
  "credential_type": "license",
  "credential_subtype": "medical_council_license",
  "credential_name": "MBBS License",
  "issuing_organization": "Medical Council of India",
  "expiry_date": "2027-12-31",
  "license_number": "MCI123456",
  "document_url": "..."
}
```

**Response:** `CredentialVerificationOut`

#### 3. Get Verification Status
```http
GET /api/v1/professionals/me/verification/status
Authorization: Bearer {supabase_jwt}
```

**Response:**
```json
{
  "identity_verification": {
    "user_id": "...",
    "verification_status": "approved",
    "verified_at": "2026-04-18T14:30:00Z"
  },
  "credentials": [
    {
      "id": 1,
      "credential_type": "license",
      "credential_name": "MBBS License",
      "verification_status": "approved",
      "expiry_date": "2027-12-31"
    }
  ],
  "identity_verified": true,
  "credentials_count": 3,
  "approved_credentials_count": 2,
  "can_appear_in_search": true,
  "visibility_blockers": []
}
```

#### 4. Generate Upload URL
```http
POST /api/v1/professionals/me/verification/upload-url
Authorization: Bearer {supabase_jwt}
Content-Type: application/json

{
  "bucket": "professional-identity-documents",
  "file_extension": "pdf"
}
```

**Response:**
```json
{
  "bucket": "professional-identity-documents",
  "file_path": "550e8400-e29b-41d4-a716-446655440000/20260418_153045_a1b2c3d4.pdf",
  "expires_at": "2026-04-18T16:30:45Z"
}
```

### **Admin Endpoints**

#### 1. Get Verification Queue
```http
GET /api/v1/admin/verification/queue?queue_type=identity&status_filter=pending&limit=50&offset=0
Authorization: Bearer {admin_supabase_jwt}
```

**Response:**
```json
{
  "items": [
    {
      "verification_id": "550e8400-e29b-41d4-a716-446655440000",
      "verification_type": "identity",
      "professional_id": "550e8400-e29b-41d4-a716-446655440000",
      "professional_username": "dr_smith",
      "professional_name": "Dr. John Smith",
      "document_type": "aadhaar",
      "verification_status": "pending",
      "submitted_at": "2026-04-17T10:30:00Z",
      "days_pending": 1
    }
  ],
  "total_count": 15,
  "pending_identity_count": 8,
  "pending_credential_count": 12,
  "expiring_licenses_count": 5
}
```

#### 2. Approve Identity
```http
POST /api/v1/admin/verification/identity/{user_id}/approve
Authorization: Bearer {admin_supabase_jwt}
Content-Type: application/json

{
  "notes": "Document verified successfully"
}
```

#### 3. Reject Credential
```http
POST /api/v1/admin/verification/credential/{credential_id}/reject
Authorization: Bearer {admin_supabase_jwt}
Content-Type: application/json

{
  "rejection_reason": "The uploaded document is not clear. Please upload a high-quality scan or photo where all text is readable."
}
```

---

## 🔄 Upload Flow (Frontend Integration)

```typescript
// Step 1: Request upload URL from backend
const { data: uploadUrl } = await fetch('/api/v1/professionals/me/verification/upload-url', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    bucket: 'professional-identity-documents',
    file_extension: 'pdf'
  })
}).then(r => r.json());

// Step 2: Upload file directly to Supabase Storage
const { data, error } = await supabase.storage
  .from(uploadUrl.bucket)
  .upload(uploadUrl.file_path, file);

if (error) throw error;

// Step 3: Submit verification request with file path
await fetch('/api/v1/professionals/me/verification/identity', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    document_type: 'aadhaar',
    document_url: uploadUrl.file_path
  })
}).then(r => r.json());
```

---

## 🧪 Testing Stage 3

### **Manual Testing**

Once backend is running, visit:
- **API Docs:** http://localhost:8000/docs
- **Professional endpoints:** `/professionals/me/verification/*`
- **Admin endpoints:** `/admin/verification/*`

### **Test Scenarios**

1. **Submit Identity Verification**
   - Professional uploads Aadhaar
   - Check status shows "pending"
   - Admin approves
   - Check status shows "approved"

2. **Submit Credential**
   - Professional uploads MBBS license with expiry date
   - Check appears in credentials list
   - Admin approves
   - Check status includes in approved_credentials_count

3. **Search Visibility Check**
   - New professional without identity: `can_appear_in_search = false`
   - After identity approval: `can_appear_in_search = true`
   - Doctor without MCI license: `can_appear_in_search = false`, `visibility_blockers = ["Missing required license: Medical Council of India"]`

4. **Admin Queue**
   - Check pending identity verifications
   - Check pending credential verifications
   - Filter by type
   - Pagination works

---

## 📦 Dependencies Added

**`requirements.txt`:**
```
supabase==2.28.3
```

This adds the Supabase Python SDK for storage operations.

---

## 🚀 Next Steps

### **Stage 4: Frontend Integration** (Professional Dashboard)
- Upload UI components
- Verification status display
- File upload with progress
- Rejection handling

### **Stage 5: Admin Dashboard**
- Verification queue UI
- Document preview
- Approve/reject actions
- Expiring licenses view

### **Stage 6: Search Enforcement**
- Update `_discovery_filters()` function
- Hide professionals without identity verification
- License compliance checks
- Grace period handling

### **Stage 7: License Expiry Automation** (Phase 1.5)
- Daily cron job for expiry checks
- Email warnings (30-day, 7-day, expired)
- Auto-hide from search
- Professional dashboard expiry alerts

---

## 🐛 Current Status

**✅ COMPLETE:** Backend container running successfully with supabase==2.28.3

**✅ VERIFIED:** All 9 verification endpoint paths registered in OpenAPI:
- `/api/v1/professionals/me/verification/identity` (GET, POST)
- `/api/v1/professionals/me/verification/credentials` (GET, POST)
- `/api/v1/professionals/me/verification/status` (GET)
- `/api/v1/professionals/me/verification/upload-url` (POST)
- `/api/v1/admin/verification/queue` (GET)
- `/api/v1/admin/verification/identity/{user_id}/approve` (POST)
- `/api/v1/admin/verification/identity/{user_id}/reject` (POST)
- `/api/v1/admin/verification/credential/{credential_id}/approve` (POST)
- `/api/v1/admin/verification/credential/{credential_id}/reject` (POST)

**🔗 API Documentation:** http://localhost:8000/docs

**Next:** Test endpoints with actual requests
