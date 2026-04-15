import requests
import json
from datetime import datetime, timezone, timedelta

base_url = 'http://localhost:8000/api/v1'

# Login
print('Logging in...')
session = requests.Session()
login_resp = session.post(
    f'{base_url}/admin/login',
    json={'email': 'admin@wolistic.com', 'password': 'WolisticAdmin@2026!'}
)
print(f'Login status: {login_resp.status_code}')
print(f'Cookies after login: {session.cookies.get_dict()}')

# Test GET (should work)
print('\nTesting GET /admin/offers...')
get_resp = session.get(f'{base_url}/admin/offers')
print(f'GET status: {get_resp.status_code}')
print(f'GET response: {get_resp.text[:200]}')

# Test POST (failing?)
print('\nTesting POST /admin/offers...')
offer_data = {
    'code': 'DEBUG001',
    'name': 'Debug Test',
    'description': 'Testing POST',
    'offer_type': 'tier_upgrade',
    'domain': 'subscription',
    'target_tier': 'pro',
    'duration_months': 1,
    'valid_from': datetime.now(timezone.utc).isoformat(),
    'is_active': True
}
post_resp = session.post(f'{base_url}/admin/offers', json=offer_data)
print(f'POST status: {post_resp.status_code}')
print(f'POST response: {post_resp.text[:500]}')

# Check if it's a CORS issue
print(f'\nResponse headers: {dict(post_resp.headers)}')
