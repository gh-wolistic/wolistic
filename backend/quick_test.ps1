# Quick Verification API Test - Simple Version
# Just tests that endpoints are registered and backend is responding

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   Verification API - Quick Test                        ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Yellow

$BaseUrl = "http://localhost:8000"

# Test 1: Backend Health
Write-Host "1. Testing backend health..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/v1/health" -UseBasicParsing
    if ($health.status -eq "ok") {
        Write-Host "   ✓ Backend is running" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Backend is not responding" -ForegroundColor Red
    Write-Host "   Make sure: docker-compose up -d backend" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check verification endpoints are registered
Write-Host "`n2. Checking verification endpoints..." -ForegroundColor Cyan
try {
    $openapi = Invoke-RestMethod -Uri "$BaseUrl/openapi.json" -UseBasicParsing
    $allPaths = $openapi.paths.PSObject.Properties.Name
    $verificationPaths = $allPaths | Where-Object { $_ -like '*verification*' }
    
    Write-Host "   ✓ Found $($verificationPaths.Count) verification endpoints" -ForegroundColor Green
    
    $verificationPaths | ForEach-Object {
        Write-Host "     - $_" -ForegroundColor Gray
    }
    
    # Check required endpoints exist
    $required = @(
        "/api/v1/professionals/me/verification/identity",
        "/api/v1/professionals/me/verification/credentials",
        "/api/v1/professionals/me/verification/status",
        "/api/v1/professionals/me/verification/upload-url",
        "/api/v1/admin/verification/queue"
    )
    
    Write-Host "`n   Checking required endpoints:" -ForegroundColor Cyan
    $allFound = $true
    foreach ($endpoint in $required) {
        if ($endpoint -in $verificationPaths) {
            Write-Host "     ✓ $endpoint" -ForegroundColor Green
        } else {
            Write-Host "     ✗ Missing: $endpoint" -ForegroundColor Red
            $allFound = $false
        }
    }
    
    if ($allFound) {
        Write-Host "`n   ✓ All required endpoints are registered!" -ForegroundColor Green
    } else {
        Write-Host "`n   ✗ Some endpoints are missing" -ForegroundColor Red
    }
    
} catch {
    Write-Host "   ✗ Failed to fetch OpenAPI schema" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

# Test 3: API Documentation
Write-Host "`n3. API Documentation:" -ForegroundColor Cyan
Write-Host "   Interactive docs: $BaseUrl/docs" -ForegroundColor Gray
Write-Host "   OpenAPI schema:   $BaseUrl/openapi.json" -ForegroundColor Gray

# Summary
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║   Quick Test Complete                                  ║" -ForegroundColor Yellow
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:8000/docs to test endpoints interactively" -ForegroundColor Gray
Write-Host "  2. See TESTING_VERIFICATION_API.md for manual test examples" -ForegroundColor Gray
Write-Host "  3. To test with real tokens, see test_verification_endpoints.py" -ForegroundColor Gray
Write-Host ""
