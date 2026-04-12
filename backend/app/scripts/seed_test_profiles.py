"""
seed_test_profiles.py
---------------------
Inserts deterministic test profiles into the local dev DB for flow validation.

Profiles created:
  - 5 professionals (body expert x2, mind expert, diet expert, gym manager)
  - 3 client users
  - Services, session types, certifications, languages, availability

Usage (from backend/):
    python -m app.scripts.seed_test_profiles

Safe to re-run: skips rows that already exist by username / email.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import time

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.professional import (
    Professional,
    ProfessionalCertification,
    ProfessionalExpertiseArea,
    ProfessionalLanguage,
    ProfessionalService,
    ProfessionalSessionType,
    ProfessionalAvailability,
    ProfessionalApproach,
)
from app.models.user import User

# ---------------------------------------------------------------------------
# Deterministic UUIDs so re-runs are idempotent
# ---------------------------------------------------------------------------

_USERS: list[dict] = [
    # --- Professionals ---
    {
        "id": uuid.UUID("00000001-0000-4000-8000-000000000001"),
        "email": "test.bodyexpert.individual@wolistic.dev",
        "full_name": "Arjun Mehta",
        "user_type": "partner",
        "user_subtype": "body_expert",
        "user_status": "verified",
        "username": "arjun-mehta-fitness",
        "specialization": "Strength & Conditioning",
        "location": "Bengaluru, Karnataka",
        "short_bio": "NSCA-certified strength coach with 8 years helping clients build functional fitness.",
        "about": (
            "I specialise in progressive overload programming for beginners to advanced lifters. "
            "Based in Bengaluru with online coaching available across India."
        ),
        "experience_years": 8,
        "sex": "male",
        "rating_avg": 4.7,
        "rating_count": 42,
        "default_timezone": "Asia/Kolkata",
        "session_types": ["in-person", "video"],
        "languages": ["English", "Hindi", "Kannada"],
        "certifications": [
            {"name": "NSCA-CSCS", "issuer": "NSCA", "issued_year": 2018},
            {"name": "CPR/AED Certified", "issuer": "Red Cross India", "issued_year": 2023},
        ],
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": "45-min goal assessment and movement screening.",
                "price": 250,
                "duration_value": 45,
                "duration_unit": "minutes",
                "mode": "video",
            },
            {
                "name": "1:1 Online Coaching Session",
                "short_brief": "60-min personalised training session via video call.",
                "price": 1500,
                "duration_value": 60,
                "duration_unit": "minutes",
                "mode": "video",
            },
        ],
        "expertise_areas": [
            {"title": "Strength Training", "description": "Barbell-based progressive resistance training."},
            {"title": "Mobility & Flexibility", "description": "Corrective exercises and movement quality work."},
        ],
        "approaches": [
            {"title": "Evidence-based programming", "description": "Periodised plans grounded in sports science."},
        ],
        "availability": [
            # Mon–Fri 6am–8pm IST
            {"day_of_week": d, "start_time": time(6, 0), "end_time": time(20, 0), "timezone": "Asia/Kolkata"}
            for d in range(0, 5)
        ],
    },
    {
        "id": uuid.UUID("00000001-0000-4000-8000-000000000002"),
        "email": "test.bodyexpert.group@wolistic.dev",
        "full_name": "Priya Sharma",
        "user_type": "partner",
        "user_subtype": "body_expert",
        "user_status": "verified",
        "username": "priya-sharma-yoga",
        "specialization": "Yoga & Group Wellness",
        "location": "Mumbai, Maharashtra",
        "short_bio": "RYT-500 yoga instructor running weekly group classes and corporate wellness programs.",
        "about": (
            "I bring 10+ years of Hatha and Vinyasa yoga teaching to group and corporate settings. "
            "My classes are inclusive and beginner-friendly."
        ),
        "experience_years": 10,
        "sex": "female",
        "rating_avg": 4.9,
        "rating_count": 118,
        "default_timezone": "Asia/Kolkata",
        "session_types": ["group", "in-person", "video"],
        "languages": ["English", "Hindi", "Marathi"],
        "certifications": [
            {"name": "RYT-500", "issuer": "Yoga Alliance", "issued_year": 2016},
        ],
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": "30-min intake call to assess your yoga journey.",
                "price": 250,
                "duration_value": 30,
                "duration_unit": "minutes",
                "mode": "video",
            },
            {
                "name": "Group Yoga Class",
                "short_brief": "60-min mixed-level Vinyasa flow. Max 15 participants.",
                "price": 400,
                "duration_value": 60,
                "duration_unit": "minutes",
                "mode": "in-person",
            },
        ],
        "expertise_areas": [
            {"title": "Hatha Yoga", "description": "Traditional posture-based practice."},
            {"title": "Corporate Wellness", "description": "Desk yoga and stress management for teams."},
        ],
        "approaches": [
            {"title": "Inclusive sequencing", "description": "Modifications offered for every pose."},
        ],
        "availability": [
            {"day_of_week": d, "start_time": time(7, 0), "end_time": time(19, 0), "timezone": "Asia/Kolkata"}
            for d in [0, 1, 2, 3, 4, 5]
        ],
    },
    {
        "id": uuid.UUID("00000001-0000-4000-8000-000000000003"),
        "email": "test.mindexpert@wolistic.dev",
        "full_name": "Kavya Nair",
        "user_type": "partner",
        "user_subtype": "mind_expert",
        "user_status": "verified",
        "username": "kavya-nair-counselling",
        "specialization": "Counselling Psychology",
        "location": "Kochi, Kerala",
        "short_bio": "Licensed counsellor specialising in anxiety, burnout, and life transitions.",
        "about": (
            "I offer a safe, non-judgmental space for adults navigating stress, anxiety, and relationship challenges. "
            "Sessions available in English and Malayalam. "
            "Note: this is a professional wellness platform, not a crisis intervention service. "
            "If you are in immediate distress, please contact iCall: 9152987821."
        ),
        "experience_years": 6,
        "sex": "female",
        "rating_avg": 4.8,
        "rating_count": 63,
        "default_timezone": "Asia/Kolkata",
        "session_types": ["video", "phone", "chat"],
        "languages": ["English", "Malayalam", "Hindi"],
        "certifications": [
            {"name": "M.Sc. Counselling Psychology", "issuer": "University of Kerala", "issued_year": 2019},
            {"name": "CBT Practitioner Certificate", "issuer": "Beck Institute", "issued_year": 2021},
        ],
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": (
                    "A 50-min introductory session. Confirmation amount fully credited back as Wolistic Coins."
                ),
                "price": 250,
                "duration_value": 50,
                "duration_unit": "minutes",
                "mode": "video",
            },
            {
                "name": "Individual Therapy Session",
                "short_brief": "50-min evidence-based counselling session.",
                "price": 2000,
                "duration_value": 50,
                "duration_unit": "minutes",
                "mode": "video",
            },
        ],
        "expertise_areas": [
            {"title": "Anxiety & Stress", "description": "CBT and mindfulness-based approaches."},
            {"title": "Burnout Recovery", "description": "Identifying root causes and building resilience."},
        ],
        "approaches": [
            {"title": "Person-centred CBT", "description": "Grounded in Cognitive Behavioural Therapy."},
        ],
        "availability": [
            {"day_of_week": d, "start_time": time(10, 0), "end_time": time(18, 0), "timezone": "Asia/Kolkata"}
            for d in [1, 2, 3, 4, 5]
        ],
    },
    {
        "id": uuid.UUID("00000001-0000-4000-8000-000000000004"),
        "email": "test.dietexpert@wolistic.dev",
        "full_name": "Dr. Sunita Patel",
        "user_type": "partner",
        "user_subtype": "diet_expert",
        "user_status": "verified",
        "username": "sunita-patel-nutrition",
        "specialization": "Clinical Nutrition & Dietetics",
        "location": "Ahmedabad, Gujarat",
        "short_bio": "Registered dietitian with a focus on metabolic health, PCOS, and diabetes management.",
        "about": (
            "I provide science-backed dietary counselling tailored to Indian food culture. "
            "Comfortable with vegetarian, vegan, and Jain dietary patterns. "
            "Fluent in Gujarati, Hindi, and English."
        ),
        "experience_years": 9,
        "sex": "female",
        "rating_avg": 4.6,
        "rating_count": 87,
        "default_timezone": "Asia/Kolkata",
        "session_types": ["video", "phone"],
        "languages": ["English", "Hindi", "Gujarati"],
        "certifications": [
            {"name": "B.Sc. Dietetics & Nutrition", "issuer": "Gujarat University", "issued_year": 2015},
            {"name": "Registered Dietitian (RD)", "issuer": "Indian Dietetic Association", "issued_year": 2016},
            {"name": "Certified Diabetes Educator", "issuer": "Research Society for the Study of Diabetes in India", "issued_year": 2020},
        ],
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": "45-min dietary history and goal-setting session.",
                "price": 250,
                "duration_value": 45,
                "duration_unit": "minutes",
                "mode": "video",
            },
            {
                "name": "Personalised Meal Plan + Follow-up",
                "short_brief": "Customised 7-day meal plan with a 30-min review call.",
                "price": 1800,
                "duration_value": 30,
                "duration_unit": "minutes",
                "mode": "video",
            },
        ],
        "expertise_areas": [
            {"title": "PCOS Nutrition", "description": "Insulin-sensitising dietary strategies."},
            {"title": "Diabetes Management", "description": "Carbohydrate counting and glycaemic index guidance."},
            {"title": "Plant-Based Diets", "description": "Vegetarian, vegan, and Jain-compatible meal planning."},
        ],
        "approaches": [
            {"title": "Culturally adaptive counselling", "description": "Plans built around Indian staples and festivals."},
        ],
        "availability": [
            {"day_of_week": d, "start_time": time(9, 0), "end_time": time(17, 0), "timezone": "Asia/Kolkata"}
            for d in range(0, 6)
        ],
    },
    {
        "id": uuid.UUID("00000001-0000-4000-8000-000000000005"),
        "email": "test.gymmanager@wolistic.dev",
        "full_name": "Rajan Verma",
        "user_type": "partner",
        "user_subtype": "body_expert",
        "user_status": "verified",
        "username": "rajan-verma-gym",
        "specialization": "Gym Training & Sports Performance",
        "location": "Delhi, NCR",
        "short_bio": "Head trainer at FitNation Delhi running boot camps, HIIT classes, and 1:1 sports conditioning.",
        "about": (
            "15 years in commercial gym training and sports conditioning. "
            "Coaching competitive athletes and recreational gym-goers alike. "
            "Corporate wellness packages available for teams."
        ),
        "experience_years": 15,
        "sex": "male",
        "rating_avg": 4.5,
        "rating_count": 210,
        "default_timezone": "Asia/Kolkata",
        "session_types": ["in-person", "group"],
        "languages": ["English", "Hindi", "Punjabi"],
        "certifications": [
            {"name": "ACE Personal Trainer", "issuer": "American Council on Exercise", "issued_year": 2012},
            {"name": "Sports Nutrition Specialist", "issuer": "ISSA", "issued_year": 2019},
        ],
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": "30-min fitness assessment and program design call.",
                "price": 250,
                "duration_value": 30,
                "duration_unit": "minutes",
                "mode": "video",
            },
            {
                "name": "1:1 In-Person Training",
                "short_brief": "60-min gym floor session at FitNation Delhi.",
                "price": 2500,
                "duration_value": 60,
                "duration_unit": "minutes",
                "mode": "in-person",
            },
            {
                "name": "HIIT Group Class",
                "short_brief": "45-min high-intensity group session. Max 20 participants.",
                "price": 500,
                "duration_value": 45,
                "duration_unit": "minutes",
                "mode": "in-person",
            },
        ],
        "expertise_areas": [
            {"title": "HIIT & Metabolic Conditioning", "description": "High-intensity circuit training."},
            {"title": "Sports Strength", "description": "Power and speed development for competitive athletes."},
        ],
        "approaches": [
            {"title": "Sport-specific periodisation", "description": "Programming aligned to competitive calendar."},
        ],
        "availability": [
            {"day_of_week": d, "start_time": time(5, 30), "end_time": time(21, 0), "timezone": "Asia/Kolkata"}
            for d in range(0, 7)
        ],
    },
]

_CLIENTS: list[dict] = [
    {
        "id": uuid.UUID("00000002-0000-4000-8000-000000000001"),
        "email": "test.client.general@wolistic.dev",
        "full_name": "Meera Joshi",
        "user_type": "client",
        "user_subtype": "client",
        "user_status": "verified",
    },
    {
        "id": uuid.UUID("00000002-0000-4000-8000-000000000002"),
        "email": "test.client.mental@wolistic.dev",
        "full_name": "Aditya Kumar",
        "user_type": "client",
        "user_subtype": "client",
        "user_status": "verified",
    },
    {
        "id": uuid.UUID("00000002-0000-4000-8000-000000000003"),
        "email": "test.client.diet@wolistic.dev",
        "full_name": "Nandini Rao",
        "user_type": "client",
        "user_subtype": "client",
        "user_status": "verified",
    },
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _upsert_user(session: AsyncSession, data: dict) -> uuid.UUID:
    result = await session.execute(
        select(User).where(User.email == data["email"])
    )
    existing = result.scalar_one_or_none()
    if existing:
        return existing.id

    user = User(
        id=data["id"],
        email=data["email"],
        full_name=data["full_name"],
        user_type=data["user_type"],
        user_subtype=data["user_subtype"],
        user_status=data["user_status"],
    )
    session.add(user)
    await session.flush()
    return user.id


async def _upsert_professional(session: AsyncSession, user_id: uuid.UUID, p: dict) -> bool:
    result = await session.execute(
        select(Professional).where(Professional.username == p["username"])
    )
    if result.scalar_one_or_none():
        return False

    prof = Professional(
        user_id=user_id,
        username=p["username"],
        specialization=p["specialization"],
        location=p.get("location"),
        short_bio=p.get("short_bio"),
        about=p.get("about"),
        experience_years=p.get("experience_years", 0),
        sex=p.get("sex", "undisclosed"),
        rating_avg=p.get("rating_avg", 0),
        rating_count=p.get("rating_count", 0),
        default_timezone=p.get("default_timezone", "Asia/Kolkata"),
    )
    session.add(prof)
    await session.flush()

    for lang in p.get("languages", []):
        session.add(ProfessionalLanguage(professional_id=user_id, language=lang))

    for cert in p.get("certifications", []):
        session.add(ProfessionalCertification(
            professional_id=user_id,
            name=cert["name"],
            issuer=cert.get("issuer"),
            issued_year=cert.get("issued_year"),
        ))

    for stype in p.get("session_types", []):
        session.add(ProfessionalSessionType(professional_id=user_id, session_type=stype))

    for svc in p.get("services", []):
        session.add(ProfessionalService(
            professional_id=user_id,
            name=svc["name"],
            short_brief=svc.get("short_brief"),
            price=svc.get("price", 0),
            duration_value=svc.get("duration_value", 60),
            duration_unit=svc.get("duration_unit", "minutes"),
            mode=svc.get("mode", "video"),
        ))

    for ea in p.get("expertise_areas", []):
        session.add(ProfessionalExpertiseArea(
            professional_id=user_id,
            title=ea["title"],
            description=ea.get("description"),
        ))

    for ap in p.get("approaches", []):
        session.add(ProfessionalApproach(
            professional_id=user_id,
            title=ap["title"],
            description=ap.get("description"),
        ))

    for slot in p.get("availability", []):
        session.add(ProfessionalAvailability(
            professional_id=user_id,
            day_of_week=slot["day_of_week"],
            start_time=slot["start_time"],
            end_time=slot["end_time"],
            timezone=slot["timezone"],
        ))

    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main() -> None:
    async with AsyncSessionLocal() as session:
        async with session.begin():
            prof_created = 0
            for p in _USERS:
                uid = await _upsert_user(session, p)
                created = await _upsert_professional(session, uid, p)
                status = "created" if created else "skipped (already exists)"
                print(f"  professional: {p['username']} → {status}")
                if created:
                    prof_created += 1

            client_created = 0
            for c in _CLIENTS:
                uid = await _upsert_user(session, c)
                status_c = "created" if uid == c["id"] else "skipped (already exists)"
                print(f"  client:       {c['email']} → {status_c}")
                # Count created only if we got the same UUID back (i.e. we inserted it)
                if uid == c["id"]:
                    client_created += 1

        print(f"\nSeed complete. Professionals: {prof_created} new | Clients: {client_created} new")
        print("\nTest accounts summary:")
        print("  PROFESSIONALS:")
        for p in _USERS:
            print(f"    /{p['username']}  ({p['user_subtype']})  {p['email']}")
        print("  CLIENTS:")
        for c in _CLIENTS:
            print(f"    {c['email']}  ({c['full_name']})")
        print("\n  NOTE: These are DB-only records. Supabase auth users must be created separately")
        print("  via the Supabase dashboard or auth admin API if testing the full sign-in flow.")


if __name__ == "__main__":
    asyncio.run(main())
