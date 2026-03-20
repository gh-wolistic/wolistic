"""Lightweight city geocoding helpers for Indian city-level matching."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CityGeo:
    city_name: str
    latitude: float
    longitude: float


_CITY_COORDS: dict[str, tuple[str, float, float]] = {
    "mumbai": ("Mumbai", 19.0760, 72.8777),
    "bombay": ("Mumbai", 19.0760, 72.8777),
    "pune": ("Pune", 18.5204, 73.8567),
    "delhi": ("Delhi", 28.6139, 77.2090),
    "new delhi": ("Delhi", 28.6139, 77.2090),
    "ncr": ("Delhi", 28.6139, 77.2090),
    "bengaluru": ("Bengaluru", 12.9716, 77.5946),
    "bangalore": ("Bengaluru", 12.9716, 77.5946),
    "hyderabad": ("Hyderabad", 17.3850, 78.4867),
    "chennai": ("Chennai", 13.0827, 80.2707),
    "kolkata": ("Kolkata", 22.5726, 88.3639),
    "calcutta": ("Kolkata", 22.5726, 88.3639),
    "ahmedabad": ("Ahmedabad", 23.0225, 72.5714),
    "jaipur": ("Jaipur", 26.9124, 75.7873),
    "surat": ("Surat", 21.1702, 72.8311),
    "lucknow": ("Lucknow", 26.8467, 80.9462),
    "kanpur": ("Kanpur", 26.4499, 80.3319),
    "nagpur": ("Nagpur", 21.1458, 79.0882),
    "indore": ("Indore", 22.7196, 75.8577),
    "bhopal": ("Bhopal", 23.2599, 77.4126),
    "patna": ("Patna", 25.5941, 85.1376),
    "kochi": ("Kochi", 9.9312, 76.2673),
    "cochin": ("Kochi", 9.9312, 76.2673),
    "thiruvananthapuram": ("Thiruvananthapuram", 8.5241, 76.9366),
    "trivandrum": ("Thiruvananthapuram", 8.5241, 76.9366),
    "goa": ("Goa", 15.2993, 74.1240),
    "mysuru": ("Mysuru", 12.2958, 76.6394),
    "mysore": ("Mysuru", 12.2958, 76.6394),
    "kodagu": ("Kushalnagar", 12.4570, 75.9590),
    "coorg": ("Kushalnagar", 12.4570, 75.9590),
    "kushalnagar": ("Kushalnagar", 12.4570, 75.9590),
    "gurgaon": ("Gurugram", 28.4595, 77.0266),
    "gurugram": ("Gurugram", 28.4595, 77.0266),
    "noida": ("Noida", 28.5355, 77.3910),
}


def _normalize_city_candidate(value: str) -> str:
    normalized = "".join(ch.lower() if (ch.isalnum() or ch.isspace()) else " " for ch in value)
    return " ".join(normalized.split())


def resolve_city_coordinates(city_or_location: str | None) -> CityGeo | None:
    if not city_or_location:
        return None

    raw = city_or_location.strip()
    if not raw:
        return None

    # Prefer first segment for values like "Mumbai, Maharashtra".
    first = raw.split(",", 1)[0].strip()
    candidate = _normalize_city_candidate(first)

    if candidate in _CITY_COORDS:
        city_name, lat, lng = _CITY_COORDS[candidate]
        return CityGeo(city_name=city_name, latitude=lat, longitude=lng)

    # Fallback: try complete normalized string.
    full_candidate = _normalize_city_candidate(raw)
    if full_candidate in _CITY_COORDS:
        city_name, lat, lng = _CITY_COORDS[full_candidate]
        return CityGeo(city_name=city_name, latitude=lat, longitude=lng)

    # Handle mixed strings like "Kushalnagar (Kodagu)".
    wrapped_candidate = f" {full_candidate} "
    matched_keys = [key for key in _CITY_COORDS if f" {key} " in wrapped_candidate]
    if matched_keys:
        best_key = max(matched_keys, key=len)
        city_name, lat, lng = _CITY_COORDS[best_key]
        return CityGeo(city_name=city_name, latitude=lat, longitude=lng)

    return None


def extract_known_cities(city_or_location: str | None) -> list[CityGeo]:
    if not city_or_location:
        return []

    raw = city_or_location.strip()
    if not raw:
        return []

    normalized_raw = raw.replace("/", ",").replace("|", ",")
    normalized_raw = normalized_raw.replace(" and ", ",")

    parts = [part.strip() for part in normalized_raw.split(",") if part.strip()]
    if not parts:
        parts = [raw]

    found: list[CityGeo] = []
    seen: set[str] = set()
    for part in parts:
        resolved = resolve_city_coordinates(part)
        if not resolved:
            continue
        key = resolved.city_name.lower()
        if key in seen:
            continue
        seen.add(key)
        found.append(resolved)

    return found
