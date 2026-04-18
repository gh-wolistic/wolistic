-- ================================================================
-- Supabase Storage Setup for Professional Verification System
-- ================================================================
-- Run this in Supabase SQL Editor to create buckets and RLS policies
--
-- Creates:
-- 1. professional-identity-documents bucket (private)
-- 2. professional-credentials bucket (private)
-- 3. RLS policies for secure access
-- ================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'professional-identity-documents',
        'professional-identity-documents',
        false,  -- Private bucket
        10485760,  -- 10MB limit for identity documents (Aadhaar, passport, etc.)
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    ),
    (
        'professional-credentials',
        'professional-credentials',
        false,  -- Private bucket
        10485760,  -- 10MB limit for certificates/licenses
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    )
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- RLS Policies for professional-identity-documents bucket
-- ================================================================

-- Policy: Professionals can upload their own identity documents
CREATE POLICY "Professionals can upload identity documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'professional-identity-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.professionals
        WHERE user_id = auth.uid()
    )
);

-- Policy: Professionals can read their own identity documents
CREATE POLICY "Professionals can read own identity documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'professional-identity-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can read all identity documents for verification
CREATE POLICY "Admins can read identity documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'professional-identity-documents'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND user_type = 'admin'
    )
);

-- Policy: Professionals can delete their own identity documents (before approval)
CREATE POLICY "Professionals can delete own identity documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'professional-identity-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.professional_identity_verification
        WHERE user_id = auth.uid()
        AND verification_status = 'pending'
    )
);

-- ================================================================
-- RLS Policies for professional-credentials bucket
-- ================================================================

-- Policy: Professionals can upload their own credentials
CREATE POLICY "Professionals can upload credentials"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'professional-credentials'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.professionals
        WHERE user_id = auth.uid()
    )
);

-- Policy: Professionals can read their own credentials
CREATE POLICY "Professionals can read own credentials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'professional-credentials'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can read all credentials for verification
CREATE POLICY "Admins can read all credentials"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'professional-credentials'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND user_type = 'admin'
    )
);

-- Policy: Professionals can delete their own credentials (before approval)
CREATE POLICY "Professionals can delete own credentials"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'professional-credentials'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ================================================================
-- Verification: Check buckets and policies were created
-- ================================================================

-- Verify buckets
SELECT 
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as max_size_mb,
    allowed_mime_types
FROM storage.buckets
WHERE id IN ('professional-identity-documents', 'professional-credentials');

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%identity%' OR policyname LIKE '%credential%'
ORDER BY policyname;
