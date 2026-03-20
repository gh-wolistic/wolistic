from app.services.geo import extract_known_cities, resolve_city_coordinates


def test_resolve_city_coordinates_handles_kushalnagar_kodagu_variant() -> None:
    resolved = resolve_city_coordinates("Kushalnagar (Kodagu)")

    assert resolved is not None
    assert resolved.city_name == "Kushalnagar"


def test_extract_known_cities_deduplicates_aliases() -> None:
    cities = extract_known_cities("Bangalore, Bengaluru")

    assert [city.city_name for city in cities] == ["Bengaluru"]


def test_extract_known_cities_from_mixed_delimiters() -> None:
    cities = extract_known_cities("Kodagu / Bangalore and Pune")

    assert [city.city_name for city in cities] == ["Kushalnagar", "Bengaluru", "Pune"]
