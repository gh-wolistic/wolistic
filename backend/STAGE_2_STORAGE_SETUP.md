# Stage 2: Supabase Storage Setup

## What You'll Do

Set up two private storage buckets for verification documents with RLS policies.

## Steps

### 1. Run Storage Setup Script

1. Go to your Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the entire contents of `supabase_verification_storage_setup.sql`
4. Click **Run**

**Expected Result:**
```
✅ 2 buckets created
✅ 8 RLS policies created
```

### 2. Verify Buckets Created

The script includes verification queries at the bottom. You should see:

| id | name | public | max_size_mb | allowed_mime_types |
|----|------|--------|-------------|-------------------|
| professional-identity-documents | professional-identity-documents | false | 10 | {image/jpeg, image/png, image/webp, application/pdf} |
| professional-credentials | professional-credentials | false | 10 | {image/jpeg, image/png, image/webp, application/pdf} |

### 3. (Optional) Set Up Auto-Deletion for Compliance

For GDPR/DPDPA compliance, identity documents should be deleted 30 days after approval.

**Option A: Using Supabase Edge Functions (Recommended)**
1. Run `supabase_document_auto_deletion.sql` in SQL Editor (creates the functions)
2. Create a Supabase Edge Function to call these functions daily
3. See comments in the SQL file for implementation

**Option B: Using pg_cron (if available)**
1. Run the `supabase_document_auto_deletion.sql` script
2. Uncomment the `cron.schedule` section at the bottom
3. The job will run daily at 2 AM UTC

**Option C: Manual (for now, implement later)**
- Skip this step for Phase 1
- We can implement auto-deletion in Phase 1.5 after validating the manual workflow

---

## What Gets Created

### Buckets

1. **professional-identity-documents** (Private)
   - Stores: Aadhaar, Passport, Driver's License, PAN Card
   - Max size: 10 MB
   - Formats: JPG, PNG, WebP, PDF
   - RLS: Professionals can upload/read their own, Admins can read all

2. **professional-credentials** (Private)
   - Stores: Education certificates, Professional certifications, Licenses
   - Max size: 10 MB
   - Formats: JPG, PNG, WebP, PDF
   - RLS: Professionals can upload/read their own, Admins can read all

### Storage Structure

```
professional-identity-documents/
  └── {user_id}/
      └── 20260418_153045_a1b2c3d4.pdf  (timestamped filename)

professional-credentials/
  └── {user_id}/
      ├── 20260418_153100_e5f6g7h8.pdf  (education certificate)
      ├── 20260418_153200_i9j0k1l2.pdf  (yoga certification)
      └── 20260418_153300_m3n4o5p6.pdf  (medical license)
```

### RLS Policies (8 total)

**Identity Documents:**
- ✅ Professionals can upload their own identity documents
- ✅ Professionals can read their own identity documents
- ✅ Admins can read all identity documents
- ✅ Professionals can delete their own (only if pending)

**Credentials:**
- ✅ Professionals can upload their own credentials
- ✅ Professionals can read their own credentials
- ✅ Admins can read all credentials
- ✅ Professionals can delete their own credentials

---

## Testing Stage 2

After running the setup script, you can test bucket access:

### Test 1: Check bucket exists
```sql
SELECT * FROM storage.buckets 
WHERE id IN ('professional-identity-documents', 'professional-credentials');
```

### Test 2: Check RLS policies
```sql
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND (policyname LIKE '%identity%' OR policyname LIKE '%credential%');
```

Should show 8 policies (4 for identity, 4 for credentials).

---

## Frontend Upload Pattern (Preview)

Once Stage 3 (Backend API) is complete, frontend will upload like this:

```typescript
// 1. Get upload intent from backend
const { data } = await api.post('/api/v1/professionals/verification/upload-url', {
  bucket: 'professional-credentials',
  file_extension: 'pdf'
});

// 2. Upload directly to Supabase Storage
const { data: uploadData, error } = await supabase.storage
  .from(data.bucket)
  .upload(data.file_path, file);

// 3. Submit verification with file path
await api.post('/api/v1/professionals/verification/credentials', {
  credential_type: 'certificate',
  credential_name: 'Yoga Teacher Training',
  issuing_organization: 'Yoga Alliance',
  document_url: data.file_path
});
```

---

## Next: Stage 3

Backend API endpoints for:
- Identity verification submission
- Credential verification submission  
- Upload URL generation (uses `verification_storage.py` service)

Ready to continue? 🚀
