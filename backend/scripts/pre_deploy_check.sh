#!/bin/bash
#
# Pre-Deploy Validation Script
# =============================
# Run this script before EVERY deployment to production.
# If smoke tests fail, deployment is BLOCKED.
#
# Usage:
#   cd backend
#   ./scripts/pre_deploy_check.sh
#
# Exit codes:
#   0 = All checks passed, safe to deploy
#   1 = Smoke tests failed, DEPLOY BLOCKED
#

set -e  # Exit on first error

echo "=========================================="
echo "🚀 PRE-DEPLOY VALIDATION"
echo "=========================================="
echo ""

# Change to backend directory
cd "$(dirname "$0")/.." || exit 1

echo "📦 Installing dependencies..."
pip install -q -r requirements.txt -r requirements-dev.txt

echo ""
echo "🧪 Running smoke tests..."
echo "   (These tests verify no auth-related 500 errors)"
echo ""

# Run smoke tests with fail-fast
if pytest -m smoke --maxfail=1 -v --tb=short; then
    echo ""
    echo "✅ All smoke tests passed"
    echo "✅ SAFE TO DEPLOY"
    echo ""
    exit 0
else
    echo ""
    echo "❌ SMOKE TESTS FAILED"
    echo "🚫 DEPLOYMENT BLOCKED"
    echo ""
    echo "Fix the failing tests before deploying."
    echo "These tests prevent production bugs like the intake.py issue."
    echo ""
    exit 1
fi
