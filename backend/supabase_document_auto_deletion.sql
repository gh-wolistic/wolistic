-- ================================================================
-- Document Auto-Deletion for Compliance (GDPR/DPDPA)
-- ================================================================
-- Run this in Supabase SQL Editor to create the auto-deletion function
--
-- Purpose: Delete identity documents 30 days after approval
-- Trigger: Should be called by a daily cron job (pg_cron or Supabase Edge Function)
-- ================================================================

-- Function: Mark identity documents for deletion after 30 days
CREATE OR REPLACE FUNCTION mark_identity_documents_for_deletion()
RETURNS TABLE(
    user_id UUID,
    document_url TEXT,
    verified_at TIMESTAMPTZ,
    deletion_scheduled_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mark documents for deletion (update document_deleted_at timestamp)
    UPDATE professional_identity_verification
    SET 
        document_deleted_at = NOW(),
        updated_at = NOW()
    WHERE 
        verification_status = 'approved'
        AND verified_at IS NOT NULL
        AND verified_at < NOW() - INTERVAL '30 days'
        AND document_deleted_at IS NULL
        AND document_url IS NOT NULL
        AND document_url != ''
    RETURNING 
        professional_identity_verification.user_id,
        professional_identity_verification.document_url,
        professional_identity_verification.verified_at,
        professional_identity_verification.document_deleted_at
    INTO user_id, document_url, verified_at, deletion_scheduled_at;
    
    RETURN NEXT;
END;
$$;

-- ================================================================
-- Actual deletion function (call this AFTER marking)
-- ================================================================
-- This function actually deletes files from Supabase Storage
-- Must be called with service_role permissions

CREATE OR REPLACE FUNCTION delete_marked_identity_documents()
RETURNS TABLE(
    deleted_count INTEGER,
    deleted_user_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated permissions
AS $$
DECLARE
    doc_record RECORD;
    delete_count INTEGER := 0;
    user_ids UUID[] := ARRAY[]::UUID[];
    file_path TEXT;
BEGIN
    -- Loop through all marked documents
    FOR doc_record IN 
        SELECT user_id, document_url
        FROM professional_identity_verification
        WHERE document_deleted_at IS NOT NULL
        AND document_url IS NOT NULL
        AND document_url != ''
        -- Only process documents marked for deletion in the last 24 hours
        -- (gives us time to audit before actual deletion)
        AND document_deleted_at < NOW() - INTERVAL '24 hours'
    LOOP
        -- Extract file path from URL
        -- Example URL: https://xxx.supabase.co/storage/v1/object/public/professional-identity-documents/USER_ID/filename.pdf
        file_path := doc_record.user_id::text || '/' || split_part(doc_record.document_url, '/', -1);
        
        -- Delete from storage (requires storage.delete permission)
        PERFORM storage.delete_object('professional-identity-documents', file_path);
        
        -- Clear document_url to prevent re-processing
        UPDATE professional_identity_verification
        SET document_url = NULL, updated_at = NOW()
        WHERE user_id = doc_record.user_id;
        
        delete_count := delete_count + 1;
        user_ids := array_append(user_ids, doc_record.user_id);
    END LOOP;
    
    deleted_count := delete_count;
    deleted_user_ids := user_ids;
    
    RETURN NEXT;
END;
$$;

-- ================================================================
-- Manual Testing (DO NOT RUN IN PRODUCTION)
-- ================================================================
-- Uncomment to test the marking function:
-- SELECT * FROM mark_identity_documents_for_deletion();

-- Uncomment to test the deletion function:
-- SELECT * FROM delete_marked_identity_documents();

-- ================================================================
-- Schedule with pg_cron (if available)
-- ================================================================
-- If you have pg_cron extension enabled, uncomment to schedule daily:
--
-- SELECT cron.schedule(
--     'delete-old-identity-documents',  -- Job name
--     '0 2 * * *',  -- Every day at 2 AM UTC
--     $$
--     SELECT mark_identity_documents_for_deletion();
--     SELECT delete_marked_identity_documents();
--     $$
-- );

-- ================================================================
-- Alternative: Supabase Edge Function Trigger
-- ================================================================
-- If using Supabase Edge Functions, create a scheduled function that calls:
-- 
-- const { data: marked, error: markError } = await supabase.rpc('mark_identity_documents_for_deletion')
-- const { data: deleted, error: deleteError } = await supabase.rpc('delete_marked_identity_documents')
--
-- Then configure cron trigger in supabase/functions/_shared/cron.ts
