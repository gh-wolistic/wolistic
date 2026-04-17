from fastapi import APIRouter

from app.api.routes.activities import router as activities_router
from app.api.routes.admin import router as admin_router
from app.api.routes.admin import auth_router as admin_auth_router
from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.booking import router as booking_router
from app.api.routes.booking import admin_router as booking_admin_router
from app.api.routes.catalog import router as catalog_router
from app.api.routes.favourites import router as favourites_router
from app.api.routes.health import router as health_router
from app.api.routes.holistic_teams import router as holistic_teams_router
from app.api.routes.intake import router as intake_router
from app.api.routes.media import router as media_router
from app.api.routes.partner_dashboard import router as partner_dashboard_router
from app.api.routes.products import router as products_router
from app.api.routes.professionals import router as professionals_router
from app.api.routes.search import router as search_router
from app.api.routes.coins import router as coins_router
from app.api.routes.classes import router as classes_router
from app.api.routes.sessions import router as sessions_router
from app.api.routes.subscription import partner_router as subscription_partner_router
from app.api.routes.subscription import admin_router as subscription_admin_router
from app.api.routes.clients import router as clients_router
from app.api.routes.settings import router as settings_router
from app.api.routes.wellness_centers import router as wellness_centers_router
from app.api.routes.messaging import router as messaging_router
from app.api.routes.notification import router as notification_router
from app.api.routes.review import router as review_router

api_router = APIRouter()
api_router.include_router(admin_auth_router)  # Session-based admin auth (no API key)
api_router.include_router(admin_router)
api_router.include_router(auth_router)
api_router.include_router(health_router, tags=["health"])
api_router.include_router(holistic_teams_router)
api_router.include_router(booking_router)
api_router.include_router(booking_admin_router)
api_router.include_router(favourites_router)
api_router.include_router(media_router)
api_router.include_router(partner_dashboard_router)
api_router.include_router(professionals_router)
api_router.include_router(products_router)
api_router.include_router(catalog_router)
api_router.include_router(wellness_centers_router)
api_router.include_router(intake_router)
api_router.include_router(search_router)
api_router.include_router(ai_router)
api_router.include_router(coins_router)
api_router.include_router(activities_router)
api_router.include_router(clients_router)
api_router.include_router(settings_router)
api_router.include_router(classes_router)
api_router.include_router(sessions_router)
api_router.include_router(subscription_partner_router)
api_router.include_router(subscription_admin_router)
api_router.include_router(messaging_router)
api_router.include_router(notification_router)
api_router.include_router(review_router)
