"""
Static Code Analysis Smoke Tests — MUST PASS before deploy.

These tests perform static code analysis on route files to catch common bug
patterns WITHOUT running the code. They catch bugs in < 1 second.

CRITICAL: These tests would have caught the intake.py bug (March 17 - April 15)
IMMEDIATELY, before it ever reached production.

Run with: pytest -m smoke -v
"""

import glob
import os
from pathlib import Path
from typing import Literal

import pytest


# ============================================================================
# SMOKE TEST: No current_user.id Usage
# ============================================================================


@pytest.mark.smoke
def test_no_current_user_id_usage() -> None:
    """
    🐛 CRITICAL BUG PREVNTION: Verify routes use current_user.user_id, not current_user.id
    
    THE INTAKE.PY BUG (March 17 - April 15, 2026):
    - Route used `current_user.id` instead of `current_user.user_id`
    - AuthenticatedUser (dataclass) has .user_id, NOT .id
    - User (SQLAlchemy model) has .id
    - Bug only affected AUTHENTICATED users (current_user != None)
    - Returned 500 error, bypassed exception handlers
    - Undetected for 1 MONTH until user submission
    
    This static test would have caught it in < 1 SECOND.
    """
    violations: list[dict[str, str | int]] = []
    
    # Scan all route files
    route_files = glob.glob("backend/app/api/routes/*.py")
    
    for file_path in route_files:
        content = Path(file_path).read_text()
        lines = content.split("\n")
        
        for line_num, line in enumerate(lines, start=1):
            # Skip comments
            if line.strip().startswith("#"):
                continue
            
            # Pattern 1: current_user.id (wrong attribute)
            # Only flag if it's NOT part of current_user.user_id
            if "current_user.id" in line:
                # Check if it's the correct .user_id
                if ".user_id" in line:
                    continue  # This is correct: current_user.user_id
                
                # Check if it's in a string or comment
                stripped = line.strip()
                if stripped.startswith("#") or stripped.startswith('"""'):
                    continue
                
                # This is potentially wrong: current_user.id
                violations.append({
                    "file": Path(file_path).name,
                    "line": line_num,
                    "code": line.strip(),
                    "pattern": "current_user.id (should be current_user.user_id)",
                })
    
    # Assert no violations found
    if violations:
        error_msg = (
            f"\n❌ FOUND {len(violations)} INTAKE.PY BUG PATTERN(S):\n"
            f"   AuthenticatedUser has .user_id, NOT .id\n"
            f"   Using current_user.id will cause AttributeError for authenticated users\n\n"
        )
        
        for v in violations[:10]:  # Show first 10
            error_msg += f"   {v['file']}:{v['line']}\n"
            error_msg += f"      {v['code']}\n"
            error_msg += f"      ^ {v['pattern']}\n\n"
        
        if len(violations) > 10:
            error_msg += f"   ... and {len(violations) - 10} more violations\n"
        
        pytest.fail(error_msg)


# ============================================================================
# SMOKE TEST: Optional Auth Null Checks
# ============================================================================


@pytest.mark.smoke
def test_optional_auth_null_checks() -> None:
    """
    🐛 BUG PREVENTION: Routes with optional auth must check if current_user is None.
    
    Routes that use get_optional_current_user can receive None when user is not
    authenticated. Accessing attributes without checking causes AttributeError.
    
    Pattern to detect:
    - current_user = Depends(get_optional_current_user)
    - Then accessing current_user.user_id WITHOUT checking if current_user is None
    """
    warnings: list[dict[str, str | int]] = []
    
    route_files = glob.glob("backend/app/api/routes/*.py")
    
    for file_path in route_files:
        content = Path(file_path).read_text()
        
        # Check if file uses get_optional_current_user
        if "get_optional_current_user" not in content:
            continue  # This file doesn't use optional auth
        
        lines = content.split("\n")
        
        # Find function definitions that use optional auth
        in_optional_auth_function = False
        function_name = ""
        
        for line_num, line in enumerate(lines, start=1):
            # Detect function with optional auth dependency
            if "async def " in line and "get_optional_current_user" in content[
                max(0, content.find(line) - 500):content.find(line) + 500
            ]:
                in_optional_auth_function = True
                function_name = line.split("async def ")[1].split("(")[0] if "async def " in line else "unknown"
            
            # Exit function scope
            if in_optional_auth_function and line.strip().startswith("async def ") and line_num > 1:
                in_optional_auth_function = False
            
            # Check for current_user attribute access
            if in_optional_auth_function and "current_user." in line:
                # Check if there's a None check nearby (within 10 lines before)
                context_start = max(0, line_num - 10)
                context_lines = lines[context_start:line_num]
                context = "\n".join(context_lines)
                
                # Look for None checks: if current_user, if not current_user, if current_user is None, etc.
                has_none_check = any([
                    "if current_user" in context,
                    "if not current_user" in context,
                    "current_user is None" in context,
                    "current_user is not None" in context,
                    "if not current_user:" in context,
                ])
                
                if not has_none_check:
                    warnings.append({
                        "file": Path(file_path).name,
                        "line": line_num,
                        "function": function_name,
                        "code": line.strip(),
                        "pattern": "Optional auth route accessing current_user without None check",
                    })
    
    # We don't fail on warnings, just report them
    if warnings:
        warning_msg = (
            f"\n⚠️  FOUND {len(warnings)} POTENTIAL OPTIONAL AUTH BUG(S):\n"
            f"   Routes using get_optional_current_user should check if current_user is None\n"
            f"   before accessing attributes.\n\n"
        )
        
        for w in warnings[:5]:  # Show first 5
            warning_msg += f"   {w['file']}:{w['line']} in {w['function']}()\n"
            warning_msg += f"      {w['code']}\n"
            warning_msg += f"      ^ {w['pattern']}\n\n"
        
        if len(warnings) > 5:
            warning_msg += f"   ... and {len(warnings) - 5} more potential issues\n"
        
        # Don't fail the test, but print the warning
        print(warning_msg)


# ============================================================================
# SMOKE TEST: FastAPI Dependency Injection Patterns
# ============================================================================


@pytest.mark.smoke
def test_auth_dependency_consistency() -> None:
    """
    Verify that routes using auth dependencies follow consistent patterns.
    
    Common mistakes:
    - Using Depends(get_current_user) but parameter is Optional[AuthenticatedUser]
    - Using Depends(get_optional_current_user) but parameter is AuthenticatedUser (not Optional)
    """
    issues: list[dict[str, str | int]] = []
    
    route_files = glob.glob("backend/app/api/routes/*.py")
    
    for file_path in route_files:
        content = Path(file_path).read_text()
        lines = content.split("\n")
        
        for line_num, line in enumerate(lines, start=1):
            # Pattern: Depends(get_current_user) with Optional[AuthenticatedUser]
            if "Depends(get_current_user)" in line and ("Optional[AuthenticatedUser]" in line or "AuthenticatedUser | None" in line):
                issues.append({
                    "file": Path(file_path).name,
                    "line": line_num,
                    "code": line.strip(),
                    "pattern": "get_current_user should not have Optional type (always returns user or raises 401)",
                })
            
            # Pattern: Depends(get_optional_current_user) without Optional
            if "Depends(get_optional_current_user)" in line:
                # Check if the type annotation includes Optional or | None
                if "Optional" not in line and "| None" not in line and "None |" not in line:
                    # This might be incorrect
                    issues.append({
                        "file": Path(file_path).name,
                        "line": line_num,
                        "code": line.strip(),
                        "pattern": "get_optional_current_user should have Optional type (can return None)",
                    })
    
    # Report issues (warnings, not failures)
    if issues:
        warning_msg = (
            f"\n⚠️  FOUND {len(issues)} AUTH DEPENDENCY TYPE INCONSISTENCY:\n"
            f"   Dependencies and type annotations should match.\n\n"
        )
        
        for issue in issues[:5]:
            warning_msg += f"   {issue['file']}:{issue['line']}\n"
            warning_msg += f"      {issue['code']}\n"
            warning_msg += f"      ^ {issue['pattern']}\n\n"
        
        if len(issues) > 5:
            warning_msg += f"   ... and {len(issues) - 5} more issues\n"
        
        print(warning_msg)


# ============================================================================
# SUMMARY
# ============================================================================
"""
STATIC CODE ANALYSIS SMOKE TEST COVERAGE:

✅ Detects current_user.id usage (intake.py bug pattern)
✅ Warns about optional auth routes without None checks
✅ Warns about auth dependency type inconsistencies

WHY THIS MATTERS:
The intake.py bug (March 17 - April 15, 2026):
- Used current_user.id instead of current_user.user_id
- Undetected for 1 MONTH
- Only affected authenticated users
- Bypassed exception handlers
- Discovered by user submission (not testing)

This static test would have caught it in < 1 SECOND, before ANY code execution.

EXECUTION TIME: < 1 second (no code execution, just file scanning)

These are BLOCKING tests — if they fail, there's a bug that WILL cause a
production incident like intake.py.
"""
