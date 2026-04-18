# Quick Verification API Test Script
# Tests all verification endpoints with minimal setup

param(
    [string]$ProfessionalToken = "",
    [string]$AdminApiKey = ""
)

$ErrorActionPreference = "Continue"
$BaseUrl = "http://localhost:8000/api/v1"
$AdminBaseUrl = "$BaseUrl/admin"

# Colors
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Test { param($msg) Write-Host "`n━━━ $msg ━━━" -ForegroundColor Blue }

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   Professional Verification API Tests                  ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow

# Test 1: Backend Health Check
Write-Test "Backend Health Check"
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get -UseBasicParsing
    if ($response.status -eq "ok") {
        Write-Success "Backend is running"
    } else {
        Write-Error "Backend health check failed"
        exit 1
    }
} catch {
    Write-Error "Backend is not responding at $BaseUrl"
    Write-Info "Make sure backend is running: docker-compose up -d backend"
    exit 1
}

# Test 2: Check OpenAPI endpoints
Write-Test "Checking API Documentation"
try {
    $openapi = Invoke-RestMethod -Uri "http://localhost:8000/openapi.json" -Method Get -UseBasicParsing
    $paths = $openapi.paths.PSObject.Properties.Name | Where-Object { $_ -like '*verification*' }
    
    Write-Success "Found $($paths.Count) verification endpoints:"
    $paths | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    
    # Check for required endpoints
    $required = @(
        "/api/v1/professionals/me/verification/identity",
        "/api/v1/professionals/me/verification/credentials",
        "/api/v1/professionals/me/verification/status",
        "/api/v1/admin/verification/queue"
    )
    
    $missing = $required | Where-Object { $_ -notin $paths }
    if ($missing.Count -gt 0) {
        Write-Error "Missing required endpoints:"
        $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    } else {
        Write-Success "All required endpoints registered"
    }
} catch {
    Write-Error "Failed to fetch OpenAPI schema"
}

# Professional Endpoint Tests
if ($ProfessionalToken) {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║   PROFESSIONAL ENDPOINT TESTS                          ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $ProfessionalToken"
        "Content-Type" = "application/json"
    }
    
    # Test: Get Verification Status
    Write-Test "GET /professionals/me/verification/status"
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/professionals/me/verification/status" `
            -Method Get -Headers $headers -UseBasicParsing
        
        Write-Success "Status retrieved"
        Write-Host "  Identity verified: $($response.identity_verified)" -ForegroundColor Gray
        Write-Host "  Credentials count: $($response.credentials_count)" -ForegroundColor Gray
        Write-Host "  Can appear in search: $($response.can_appear_in_search)" -ForegroundColor Gray
        
        if ($response.visibility_blockers -and $response.visibility_blockers.Count -gt 0) {
            Write-Host "  Blockers:" -ForegroundColor Yellow
            $response.visibility_blockers | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
        }
    } catch {
        Write-Error "Status request failed: $_"
        Write-Host $_.Exception.Response -ForegroundColor Red
    }
    
    # Test: Request Upload URL
    Write-Test "POST /professionals/me/verification/upload-url"
    try {
        $body = @{
            bucket = "professional-identity-documents"
            file_extension = "pdf"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$BaseUrl/professionals/me/verification/upload-url" `
            -Method Post -Headers $headers -Body $body -UseBasicParsing
        
        Write-Success "Upload URL generated"
        Write-Host "  Bucket: $($response.bucket)" -ForegroundColor Gray
        Write-Host "  File path: $($response.file_path)" -ForegroundColor Gray
        Write-Host "  Expires: $($response.expires_at)" -ForegroundColor Gray
    } catch {
        Write-Error "Upload URL request failed: $_"
    }
    
    # Test: Get Credentials
    Write-Test "GET /professionals/me/verification/credentials"
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/professionals/me/verification/credentials" `
            -Method Get -Headers $headers -UseBasicParsing
        
        Write-Success "Retrieved $($response.Count) credentials"
        $response | ForEach-Object {
            Write-Host "  - $($_.credential_name) ($($_.verification_status))" -ForegroundColor Gray
        }
    } catch {
        Write-Error "Credentials request failed: $_"
    }
    
} else {
    Write-Host "`n⚠️  Skipping professional tests - no token provided" -ForegroundColor Yellow
    Write-Info "To test professional endpoints:"
    Write-Info "  1. Login to frontend as a professional"
    Write-Info "  2. Copy JWT token from browser DevTools > Application > Local Storage"
    Write-Info "  3. Run: .\test_verification.ps1 -ProfessionalToken 'YOUR_TOKEN'"
}

# Admin Endpoint Tests
if ($AdminApiKey) {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║   ADMIN ENDPOINT TESTS                                 ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    
    $adminHeaders = @{
        "X-Admin-Key" = $AdminApiKey
        "Content-Type" = "application/json"
    }
    
    # Test: Get Verification Queue
    Write-Test "GET /admin/verification/queue"
    try {
        $response = Invoke-RestMethod -Uri "$AdminBaseUrl/verification/queue" `
            -Method Get -Headers $adminHeaders -UseBasicParsing
        
        Write-Success "Queue retrieved"
        Write-Host "  Total items: $($response.total_count)" -ForegroundColor Gray
        Write-Host "  Pending identity: $($response.pending_identity_count)" -ForegroundColor Gray
        Write-Host "  Pending credentials: $($response.pending_credential_count)" -ForegroundColor Gray
        Write-Host "  Expiring licenses: $($response.expiring_licenses_count)" -ForegroundColor Gray
        
        if ($response.items -and $response.items.Count -gt 0) {
            Write-Host "`n  First item:" -ForegroundColor Gray
            $item = $response.items[0]
            Write-Host "    Type: $($item.verification_type)" -ForegroundColor Gray
            Write-Host "    Professional: $($item.professional_username)" -ForegroundColor Gray
            Write-Host "    Status: $($item.verification_status)" -ForegroundColor Gray
        }
    } catch {
        Write-Error "Queue request failed: $_"
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Info "Check ADMIN_API_KEY is correct in .env"
        }
    }
    
    # Test: Filter by Identity
    Write-Test "GET /admin/verification/queue?queue_type=identity"
    try {
        $uri = "{0}/verification/queue?queue_type=identity`&status_filter=pending" -f $AdminBaseUrl
        $response = Invoke-RestMethod -Uri $uri -Method Get -Headers $adminHeaders -UseBasicParsing
        
        Write-Success "Identity queue: $($response.items.Count) pending"
    } catch {
        Write-Error "Identity queue request failed: $_"
    }
    
    # Test: Filter by Credential
    Write-Test "GET /admin/verification/queue?queue_type=credential"
    try {
        $uri = "{0}/verification/queue?queue_type=credential`&status_filter=pending" -f $AdminBaseUrl
        $response = Invoke-RestMethod -Uri $uri -Method Get -Headers $adminHeaders -UseBasicParsing
        
        Write-Success "Credential queue: $($response.items.Count) pending"
    } catch {
        Write-Error "Credential queue request failed: $_"
    }
    
} else {
    Write-Host "`n⚠️  Skipping admin tests - no API key provided" -ForegroundColor Yellow
    Write-Info "To test admin endpoints:"
    Write-Info "  1. Copy ADMIN_API_KEY from backend/.env"
    Write-Info "  2. Run: .\test_verification.ps1 -AdminApiKey 'YOUR_KEY'"
}

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   Tests Complete                                       ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow

Write-Info "Next Steps:"
Write-Info "  • Review test results above"
Write-Info "  • Check TESTING_VERIFICATION_API.md for manual testing"
Write-Info "  • Open http://localhost:8000/docs to test interactively"
