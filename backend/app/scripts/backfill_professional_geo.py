from __future__ import annotations

import asyncio

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models.professional import Professional, ProfessionalServiceArea
from app.services.geo import extract_known_cities, resolve_city_coordinates


async def run_backfill() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Professional)
            .options(selectinload(Professional.service_areas))
            .order_by(Professional.created_at.asc())
        )
        professionals = result.scalars().all()

        updated_professionals = 0
        created_service_areas = 0
        updated_service_areas = 0

        for professional in professionals:
            changed = False

            # Auto-populate primary coordinates from current location text.
            resolved_location = resolve_city_coordinates(professional.location)
            if resolved_location and (professional.latitude is None or professional.longitude is None):
                professional.location = resolved_location.city_name
                professional.latitude = resolved_location.latitude
                professional.longitude = resolved_location.longitude
                changed = True

            existing_areas = list(professional.service_areas)
            resolved_cities = extract_known_cities(professional.location)

            if not existing_areas and professional.location:
                if resolved_cities:
                    for index, resolved in enumerate(resolved_cities):
                        session.add(
                            ProfessionalServiceArea(
                                professional_id=professional.user_id,
                                city_name=resolved.city_name,
                                latitude=resolved.latitude,
                                longitude=resolved.longitude,
                                radius_km=300,
                                is_primary=index == 0,
                            )
                        )
                        created_service_areas += 1
                elif resolved_location:
                    session.add(
                        ProfessionalServiceArea(
                            professional_id=professional.user_id,
                            city_name=resolved_location.city_name,
                            latitude=resolved_location.latitude,
                            longitude=resolved_location.longitude,
                            radius_km=300,
                            is_primary=True,
                        )
                    )
                    created_service_areas += 1

            elif existing_areas and resolved_cities:
                existing_city_keys = {area.city_name.strip().lower() for area in existing_areas}
                has_primary = any(area.is_primary for area in existing_areas)

                for index, resolved in enumerate(resolved_cities):
                    key = resolved.city_name.strip().lower()
                    if key in existing_city_keys:
                        continue

                    session.add(
                        ProfessionalServiceArea(
                            professional_id=professional.user_id,
                            city_name=resolved.city_name,
                            latitude=resolved.latitude,
                            longitude=resolved.longitude,
                            radius_km=300,
                            is_primary=(not has_primary and index == 0),
                        )
                    )
                    created_service_areas += 1
                    existing_city_keys.add(key)

            for area in existing_areas:
                if area.latitude is not None and area.longitude is not None:
                    continue
                resolved_area = resolve_city_coordinates(area.city_name)
                if resolved_area:
                    area.city_name = resolved_area.city_name
                    area.latitude = resolved_area.latitude
                    area.longitude = resolved_area.longitude
                    updated_service_areas += 1

            if changed:
                updated_professionals += 1

        await session.commit()

    print("Backfill complete")
    print(f"Professionals updated: {updated_professionals}")
    print(f"Service areas created: {created_service_areas}")
    print(f"Service areas updated: {updated_service_areas}")


if __name__ == "__main__":
    asyncio.run(run_backfill())
