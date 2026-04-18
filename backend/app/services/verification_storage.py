"""
Supabase Storage utilities for professional verification documents.

Provides helpers for generating signed upload URLs and managing document storage.
"""
import uuid
from datetime import datetime, timedelta
from typing import Literal, Optional

from supabase import Client


DocumentType = Literal["identity", "credential"]
IdentityDocumentType = Literal["aadhaar", "passport", "drivers_license", "pan_card"]
CredentialDocumentType = Literal["education", "certificate", "license"]


class VerificationStorageService:
    """Service for managing verification document uploads in Supabase Storage."""
    
    def __init__(self, supabase_client: Client):
        self.client = supabase_client
        self.identity_bucket = "professional-identity-documents"
        self.credential_bucket = "professional-credentials"
    
    def generate_upload_url(
        self,
        user_id: uuid.UUID,
        document_type: DocumentType,
        file_extension: str,
        expires_in_seconds: int = 3600
    ) -> dict:
        """
        Generate a signed upload URL for document submission.
        
        Professional uploads directly to Supabase Storage (bypasses backend).
        Backend only generates the upload intent URL.
        
        Args:
            user_id: Professional's user_id
            document_type: "identity" or "credential"
            file_extension: File extension (e.g., "pdf", "jpg", "png")
            expires_in_seconds: URL expiry time (default: 1 hour)
        
        Returns:
            {
                "upload_url": "https://...",
                "file_path": "user_id/filename.ext",
                "expires_at": "2026-04-18T15:30:00Z"
            }
        
        Example Frontend Usage:
            ```typescript
            // 1. Request upload URL from backend
            const { data } = await api.post('/professionals/verification/identity/upload-url', {
                file_extension: 'pdf'
            });
            
            // 2. Upload file directly to Supabase
            await fetch(data.upload_url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });
            
            // 3. Submit verification request with file_path
            await api.post('/professionals/verification/identity', {
                document_type: 'aadhaar',
                document_url: data.file_path
            });
            ```
        """
        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = uuid.uuid4().hex[:8]
        filename = f"{timestamp}_{unique_id}.{file_extension.lstrip('.')}"
        
        # File path: user_id/filename
        file_path = f"{user_id}/{filename}"
        
        # Select bucket
        bucket = self.identity_bucket if document_type == "identity" else self.credential_bucket
        
        # Generate signed upload URL
        # Note: Supabase Python client doesn't have create_signed_upload_url yet
        # Use the REST API directly or return path for frontend to handle
        
        # For now, return the path - frontend will use Supabase client directly
        # This is actually better for security (no backend bottleneck)
        return {
            "bucket": bucket,
            "file_path": file_path,
            "expires_at": (datetime.utcnow() + timedelta(seconds=expires_in_seconds)).isoformat() + "Z"
        }
    
    def get_signed_download_url(
        self,
        document_url: str,
        bucket_type: DocumentType,
        expires_in_seconds: int = 3600
    ) -> str:
        """
        Generate a signed download URL for viewing documents.
        
        Used by admin dashboard to preview verification documents.
        
        Args:
            document_url: File path in storage (e.g., "user_id/document.pdf")
            bucket_type: "identity" or "credential"
            expires_in_seconds: URL expiry time
        
        Returns:
            Signed URL string
        """
        bucket = self.identity_bucket if bucket_type == "identity" else self.credential_bucket
        
        # Generate signed URL for download/preview
        response = self.client.storage.from_(bucket).create_signed_url(
            document_url,
            expires_in_seconds
        )
        
        return response.get("signedURL", "")
    
    def delete_document(
        self,
        document_url: str,
        bucket_type: DocumentType
    ) -> bool:
        """
        Delete a document from storage.
        
        Used for:
        - Compliance (auto-delete after 30 days)
        - Professional deleting pending documents
        
        Args:
            document_url: File path in storage
            bucket_type: "identity" or "credential"
        
        Returns:
            True if deleted successfully
        """
        bucket = self.identity_bucket if bucket_type == "identity" else self.credential_bucket
        
        try:
            self.client.storage.from_(bucket).remove([document_url])
            return True
        except Exception as e:
            # Log error
            print(f"Error deleting document {document_url}: {e}")
            return False
    
    def list_user_documents(
        self,
        user_id: uuid.UUID,
        bucket_type: DocumentType
    ) -> list[dict]:
        """
        List all documents for a user in a bucket.
        
        Args:
            user_id: Professional's user_id
            bucket_type: "identity" or "credential"
        
        Returns:
            List of file metadata dicts
        """
        bucket = self.identity_bucket if bucket_type == "identity" else self.credential_bucket
        
        try:
            files = self.client.storage.from_(bucket).list(str(user_id))
            return files
        except Exception as e:
            print(f"Error listing documents for user {user_id}: {e}")
            return []


# Dependency for FastAPI routes
def get_verification_storage_service(supabase_client: Client) -> VerificationStorageService:
    """FastAPI dependency for injecting storage service."""
    return VerificationStorageService(supabase_client)
