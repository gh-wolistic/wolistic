from fastapi import APIRouter

from app.api.routes.ai import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.booking import router as booking_router
from app.api.routes.favourites import router as favourites_router
from app.api.routes.health import router as health_router
from app.api.routes.holistic_teams import router as holistic_teams_router
from app.api.routes.intake import router as intake_router
from app.api.routes.products import router as products_router
from app.api.routes.professionals import router as professionals_router
from app.api.routes.search import router as search_router
from app.api.routes.wellness_centers import router as wellness_centers_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(health_router, tags=["health"])
api_router.include_router(holistic_teams_router)
api_router.include_router(booking_router)
api_router.include_router(favourites_router)
api_router.include_router(professionals_router)
api_router.include_router(products_router)
api_router.include_router(wellness_centers_router)
api_router.include_router(intake_router)
api_router.include_router(search_router)
api_router.include_router(ai_router)
