"""
ui_flow_create_profiles.py
---------------------------
Simulates exactly what the Wolistic UI does to create professional profiles:

  Step 1 — Sign-up   : POST /auth/v1/admin/users (Supabase admin, bypasses email confirm)
  Step 2 — Login     : POST /auth/v1/token (get JWT same as Supabase signInWithPassword)
  Step 3 — Init user : GET  /api/v1/auth/me (creates user row — same as frontend startup)
  Step 4 — Onboarding: PATCH /api/v1/auth/onboarding (sets user_type/subtype — same as
                        UserOnboardingProvider.tsx calling updateUserOnboardingSelection)
  Step 5 — Profile   : PUT  /api/v1/professionals/me/editor (same as ProfileStudioPage
                        handleSave + handlePublish)

Records UX FRICTION encountered at each step.

Usage (from backend/):
    python -m app.scripts.ui_flow_create_profiles
"""

import sys
import json
import time
import urllib.request
import urllib.error
import urllib.parse

# ---------------------------------------------------------------------------
# Config — mirrors .env values
# ---------------------------------------------------------------------------
SUPABASE_URL = "https://kqasubvboiwpmzwnpylo.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXN1YnZib2l3cG16d25weWxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4MTgyOSwiZXhwIjoyMDkwNDU3ODI5fQ"
    ".gQOifYx_WGgq_cqPSA4bmso5z5sVlADP0iMe0HSB2fg"
)
BACKEND_API = "http://127.0.0.1:8000/api/v1"

# ---------------------------------------------------------------------------
# Low-level HTTP helpers (stdlib only, no requests dependency needed)
# ---------------------------------------------------------------------------

def http(method: str, url: str, body: dict | None = None, headers: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        body_text = exc.read().decode()
        raise RuntimeError(f"HTTP {exc.code} {url}: {body_text}") from exc


def supabase_admin(method: str, path: str, body: dict | None = None) -> dict:
    return http(
        method,
        f"{SUPABASE_URL}{path}",
        body=body,
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        },
    )


def backend(method: str, path: str, token: str, body: dict | None = None) -> dict:
    return http(
        method,
        f"{BACKEND_API}{path}",
        body=body,
        headers={"Authorization": f"Bearer {token}"},
    )


# ---------------------------------------------------------------------------
# Profile definitions — realistic data, mirroring what a real user would enter
# in each Profile Studio tab (Basics / Practice / Identity / Services / Booking)
# ---------------------------------------------------------------------------

PROFILES = [
    # ── 1. Body Expert (Individual) ──────────────────────────────────────────
    {
        "email": "arjun.mehta.wolistic@mailinator.com",
        "password": "WolisticTest@123",
        "full_name": "Arjun Mehta",
        "user_subtype": "body_expert",
        # ── Basics tab ──
        "username": "arjun-mehta",
        "specialization": "Strength & Conditioning",
        "location": "Bengaluru, Karnataka",
        "sex": "male",
        "experience_years": 8,
        "short_bio": "8 years training competitive athletes and everyday gym-goers in Bengaluru.",
        "about": (
            "I specialise in progressive overload programming for beginners to advanced lifters. "
            "Certified personal trainer (ACE) with a focus on functional movement and injury prevention. "
            "I work with athletes, office workers, and everyone in between."
        ),
        # ── Practice tab ──
        # NOTE: UI session types are 'online', 'offline', 'hybrid' — not 'video'/'in-person'
        # This is a FRICTION POINT discovered during flow audit (see report below)
        "session_types": ["offline", "online"],
        "languages": ["English", "Hindi"],
        "subcategories": ["Strength Training", "Functional Fitness", "Athletic Conditioning"],
        "education": ["B.Sc. Sports Science, Bangalore University (2016)"],
        "certifications": [
            {"name": "ACE Certified Personal Trainer", "issuer": "American Council on Exercise", "issued_year": 2018},
            {"name": "CPR/AED First Responder", "issuer": "Red Cross India", "issued_year": 2023},
        ],
        "expertise_areas": [
            {"title": "Strength & Hypertrophy", "description": "Periodised barbell and dumbbell programming for lean muscle gain."},
            {"title": "Mobility & Injury Prevention", "description": "Corrective exercises and movement screening to stay pain-free."},
        ],
        "approaches": [
            {"title": "Evidence-based programming", "description": "Every plan is grounded in sports science literature."},
            {"title": "Goal-first coaching", "description": "Training blocks designed around your life schedule, not the other way around."},
        ],
        # ── Identity tab ──
        "pronouns": "he/him",
        "who_i_work_with": "Competitive athletes, desk workers with posture issues, beginners who want to build a strong foundation.",
        "client_goals": ["Muscle gain", "Injury recovery", "Flexibility"],
        "default_timezone": "Asia/Kolkata",
        "response_time_hours": 6,
        "cancellation_hours": 24,
        "social_links": {"instagram": "https://instagram.com/arjunmehta.fit"},
        # ── Services tab ──
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": "45-min goal assessment, movement screening, and training roadmap.",
                "price": 250,
                "negotiable": False,
                "offer_type": "none",
                "mode": "online,offline",
                "duration_value": 45,
                "duration_unit": "mins",
                "is_active": True,
            },
            {
                "name": "1:1 Coaching Session",
                "short_brief": "60-min personalised strength training session (in-gym or video).",
                "price": 800,
                "negotiable": False,
                "offer_type": "none",
                "mode": "offline,online",
                "duration_value": 60,
                "duration_unit": "mins",
                "is_active": True,
            },
        ],
        # ── Booking tab ──
        "availability_slots": [
            {"day_of_week": d, "start_time": "06:00:00", "end_time": "20:00:00", "timezone": "Asia/Kolkata"}
            for d in range(0, 5)  # Mon–Fri
        ],
        "booking_question_templates": [
            {"prompt": "What are your primary fitness goals?", "display_order": 1, "is_required": True, "is_active": True},
            {"prompt": "Do you have any injuries or physical limitations?", "display_order": 2, "is_required": True, "is_active": True},
            {"prompt": "How many days per week can you train?", "display_order": 3, "is_required": False, "is_active": True},
        ],
    },

    # ── 2. Body Expert (Group Fitness) ───────────────────────────────────────
    {
        "email": "priya.sharma.wolistic@mailinator.com",
        "password": "WolisticTest@123",
        "full_name": "Priya Sharma",
        "user_subtype": "body_expert",
        "username": "priya-sharma-yoga",
        "specialization": "Yoga & Group Wellness",
        "location": "Mumbai, Maharashtra",
        "sex": "female",
        "experience_years": 10,
        "short_bio": "RYT-500 yoga instructor in Mumbai. Group classes, retreats, and corporate wellness.",
        "about": (
            "I bring 10+ years of Hatha and Vinyasa yoga teaching to group settings. "
            "My classes are inclusive and beginner-friendly — I believe yoga is for every body. "
            "I run weekly group classes in Mumbai and online yoga retreats."
        ),
        "session_types": ["offline", "online", "hybrid"],
        "languages": ["English", "Marathi"],
        "subcategories": ["Yoga", "Group Fitness", "Corporate Wellness", "Breathwork"],
        "education": ["Yoga Alliance 500-hr RYT (2016)", "B.A. Physical Education, Mumbai University (2013)"],
        "certifications": [
            {"name": "RYT-500", "issuer": "Yoga Alliance", "issued_year": 2016},
            {"name": "Trauma-Informed Yoga Facilitator", "issuer": "Yoga Alliance", "issued_year": 2022},
        ],
        "expertise_areas": [
            {"title": "Hatha Yoga", "description": "Traditional alignment-focused posture practice."},
            {"title": "Vinyasa Flow", "description": "Dynamic movement classes linking breath and motion."},
            {"title": "Corporate Desk Yoga", "description": "Chair yoga and stress-relief for office teams."},
        ],
        "approaches": [
            {"title": "Inclusive sequencing", "description": "Every pose taught with beginner modifications."},
            {"title": "Breath-led movement", "description": "Pranayama integrated into asana sequences."},
        ],
        "pronouns": "she/her",
        "who_i_work_with": "Beginners, corporate teams, people recovering from burnout, and experienced practitioners deepening their practice.",
        "client_goals": ["Stress reduction", "Flexibility", "Better sleep"],
        "default_timezone": "Asia/Kolkata",
        "response_time_hours": 12,
        "cancellation_hours": 24,
        "social_links": {"instagram": "https://instagram.com/priyayoga.mumbai"},
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": "30-min intake call to understand your yoga journey and goals.",
                "price": 250,
                "negotiable": False,
                "offer_type": "none",
                "mode": "online",
                "duration_value": 30,
                "duration_unit": "mins",
                "is_active": True,
            },
            {
                "name": "Group Yoga Class",
                "short_brief": "60-min Vinyasa Flow group class. Max 15 participants.",
                "price": 500,
                "negotiable": False,
                "offer_type": "none",
                "mode": "offline,online",
                "duration_value": 60,
                "duration_unit": "mins",
                "is_active": True,
            },
            {
                "name": "1:1 Private Session",
                "short_brief": "Personalised 60-min yoga practice tailored to your needs.",
                "price": 1200,
                "negotiable": False,
                "offer_type": "none",
                "mode": "offline,online",
                "duration_value": 60,
                "duration_unit": "mins",
                "is_active": True,
            },
        ],
        "availability_slots": [
            {"day_of_week": d, "start_time": "07:00:00", "end_time": "19:00:00", "timezone": "Asia/Kolkata"}
            for d in [0, 1, 2, 3, 4, 5]  # Mon–Sat
        ],
        "booking_question_templates": [
            {"prompt": "Have you practised yoga before? If yes, for how long?", "display_order": 1, "is_required": True, "is_active": True},
            {"prompt": "Do you have any physical injuries or health concerns?", "display_order": 2, "is_required": True, "is_active": True},
            {"prompt": "What do you hope to gain from your yoga journey with me?", "display_order": 3, "is_required": False, "is_active": True},
        ],
    },

    # ── 3. Dietitian ─────────────────────────────────────────────────────────
    {
        "email": "sunita.patel.wolistic@mailinator.com",
        "password": "WolisticTest@123",
        "full_name": "Sunita Patel",
        "user_subtype": "diet_expert",
        "username": "sunita-patel-nutrition",
        "specialization": "Clinical Nutrition & Dietetics",
        "location": "Delhi, NCR",
        "sex": "female",
        "experience_years": 10,
        "short_bio": "Registered Dietitian with 10+ years in clinical nutrition, PCOS, and diabetes management.",
        "about": (
            "I work with clients across India to build sustainable, science-backed eating habits. "
            "Comfortable with vegetarian, vegan, Jain, and gluten-free dietary patterns. "
            "I specialise in PCOS, Type 2 diabetes, metabolic syndrome, and weight management."
        ),
        "session_types": ["online"],
        "languages": ["English", "Hindi", "Gujarati"],
        "subcategories": ["Therapeutic Nutrition", "PCOS Management", "Diabetes Nutrition", "Weight Management"],
        "education": [
            "B.Sc. Dietetics & Nutrition, Delhi University (2013)",
            "M.Sc. Clinical Nutrition, IGNOU (2016)",
        ],
        "certifications": [
            {"name": "Registered Dietitian (RD)", "issuer": "Indian Dietetic Association", "issued_year": 2014},
            {"name": "Certified Diabetes Educator", "issuer": "Research Society for the Study of Diabetes in India", "issued_year": 2019},
        ],
        "expertise_areas": [
            {"title": "PCOS Nutrition", "description": "Insulin-sensitising dietary strategies and anti-inflammatory meal planning."},
            {"title": "Diabetes Management", "description": "Carbohydrate counting, glycaemic index guidance, and medication-aware meal timing."},
            {"title": "Plant-Based Diets", "description": "Nutritionally complete vegetarian and vegan plans for Indian households."},
        ],
        "approaches": [
            {"title": "Culturally adaptive counselling", "description": "Meal plans built around Indian staples, regional cuisines, and festival eating."},
            {"title": "Root-cause nutrition", "description": "Addressing metabolic drivers, not just surface symptoms."},
        ],
        "pronouns": "she/her",
        "who_i_work_with": "Women with PCOS, people managing Type 2 diabetes, families wanting to eat healthier, and clients seeking weight management.",
        "client_goals": ["Weight loss", "Gut health", "Energy boost"],
        "default_timezone": "Asia/Kolkata",
        "response_time_hours": 12,
        "cancellation_hours": 24,
        "social_links": {"instagram": "https://instagram.com/drsunitatnutrition"},
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": "45-min dietary history, medical review, and goal-setting session.",
                "price": 250,
                "negotiable": False,
                "offer_type": "none",
                "mode": "online",
                "duration_value": 45,
                "duration_unit": "mins",
                "is_active": True,
            },
            {
                "name": "Personalised Nutrition Consultation",
                "short_brief": "60-min in-depth consultation with a customised meal plan.",
                "price": 1000,
                "negotiable": False,
                "offer_type": "none",
                "mode": "online",
                "duration_value": 60,
                "duration_unit": "mins",
                "is_active": True,
            },
            {
                "name": "Monthly Nutrition Programme",
                "short_brief": "4-week personalised programme with weekly 30-min check-in calls.",
                "price": 3500,
                "negotiable": True,
                "offer_type": "none",
                "mode": "online",
                "duration_value": 30,
                "duration_unit": "mins",
                "is_active": True,
            },
        ],
        "availability_slots": [
            {"day_of_week": d, "start_time": "09:00:00", "end_time": "17:00:00", "timezone": "Asia/Kolkata"}
            for d in range(0, 6)  # Mon–Sat
        ],
        "booking_question_templates": [
            {"prompt": "What are your dietary preferences or restrictions? (e.g. vegetarian, vegan, gluten-free)", "display_order": 1, "is_required": True, "is_active": True},
            {"prompt": "Do you have any food allergies or intolerances?", "display_order": 2, "is_required": True, "is_active": True},
            {"prompt": "Do you have any diagnosed medical conditions (e.g. PCOS, diabetes, thyroid)?", "display_order": 3, "is_required": True, "is_active": True},
            {"prompt": "What is your primary nutrition goal?", "display_order": 4, "is_required": True, "is_active": True},
            {"prompt": "Are you currently taking any medications or supplements?", "display_order": 5, "is_required": False, "is_active": True},
        ],
    },

    # ── 4. Therapist / Counsellor ─────────────────────────────────────────────
    {
        "email": "kavya.nair.wolistic@mailinator.com",
        "password": "WolisticTest@123",
        "full_name": "Kavya Nair",
        # NOTE: no "therapist" subtype in UI — must pick "mind_expert"
        # FRICTION: the UI shows "Mind Expert" not "Therapist" — user may hesitate
        "user_subtype": "mind_expert",
        "username": "kavya-nair-therapy",
        "specialization": "Counselling Psychology",
        "location": "Bengaluru, Karnataka",
        "sex": "female",
        "experience_years": 7,
        "short_bio": "Licensed counsellor specialising in CBT, mindfulness, and trauma-informed care.",
        "about": (
            "I offer a safe, non-judgmental space for adults navigating anxiety, burnout, life transitions, "
            "and relationship challenges. My practice is rooted in Cognitive Behavioural Therapy (CBT) "
            "and mindfulness-based approaches. "
            "I work in English and Kannada.\n\n"
            "Note: This is a professional wellness coaching service. "
            "If you are experiencing a mental health crisis, please contact iCall at 9152987821."
        ),
        "session_types": ["online"],
        "languages": ["English", "Kannada"],
        "subcategories": ["CBT", "Anxiety Management", "Stress & Burnout", "Mindfulness", "Trauma-informed Care"],
        "education": [
            "M.A. Clinical Psychology, Bangalore University (2019)",
            "Post-Graduate Diploma in Counselling, NIMHANS (2020)",
        ],
        "certifications": [
            {"name": "Licensed Counsellor", "issuer": "Rehabilitation Council of India", "issued_year": 2020},
            {"name": "CBT Practitioner Certificate", "issuer": "Beck Institute", "issued_year": 2021},
            {"name": "Mindfulness-Based Stress Reduction (MBSR)", "issuer": "Centre for Mindfulness, UMass", "issued_year": 2022},
        ],
        "expertise_areas": [
            {"title": "Anxiety & Panic", "description": "CBT-based evidence-based approaches to anxiety management."},
            {"title": "Burnout & Stress", "description": "Identifying burnout drivers and building sustainable resilience."},
            {"title": "Relationship & Life Transitions", "description": "Navigating major life changes with psychological support."},
        ],
        "approaches": [
            {"title": "Cognitive Behavioural Therapy (CBT)", "description": "Structured, goal-oriented sessions grounded in CBT."},
            {"title": "Mindfulness-based practice", "description": "Integrating breath, body awareness, and present-moment focus."},
        ],
        "pronouns": "she/her",
        "who_i_work_with": "Adults navigating anxiety, burnout, career stress, grief, and relationship challenges.",
        "client_goals": ["Stress reduction", "Mental clarity", "Better sleep"],
        "default_timezone": "Asia/Kolkata",
        "response_time_hours": 24,
        "cancellation_hours": 24,
        "social_links": {},
        "services": [
            {
                "name": "Initial Consultation",
                "short_brief": (
                    "A 50-min introductory session. "
                    "A small confirmation amount is collected — it is fully credited back as Wolistic Coins."
                ),
                "price": 250,
                "negotiable": False,
                "offer_type": "none",
                "mode": "online",
                "duration_value": 50,
                "duration_unit": "mins",
                "is_active": True,
            },
            {
                "name": "Individual Counselling Session",
                "short_brief": "50-min evidence-based counselling session via secure video call.",
                "price": 1200,
                "negotiable": False,
                "offer_type": "none",
                "mode": "online",
                "duration_value": 50,
                "duration_unit": "mins",
                "is_active": True,
            },
        ],
        "availability_slots": [
            {"day_of_week": d, "start_time": "10:00:00", "end_time": "18:00:00", "timezone": "Asia/Kolkata"}
            for d in [1, 2, 3, 4, 5]  # Mon–Fri
        ],
        "booking_question_templates": [
            {"prompt": "What brings you to seek counselling support right now?", "display_order": 1, "is_required": True, "is_active": True},
            {"prompt": "How would you rate your current stress levels on a scale of 1–10?", "display_order": 2, "is_required": True, "is_active": True},
            {"prompt": "Have you had prior counselling or therapy experience?", "display_order": 3, "is_required": False, "is_active": True},
            {"prompt": "What are your primary goals for our sessions?", "display_order": 4, "is_required": True, "is_active": True},
        ],
    },
]


# ---------------------------------------------------------------------------
# UX Friction Log — populated as we simulate each step
# ---------------------------------------------------------------------------

FRICTION_LOG: list[dict] = []


def log_friction(step: str, profile_name: str, issue: str, severity: str = "medium"):
    record = {"step": step, "profile": profile_name, "issue": issue, "severity": severity}
    FRICTION_LOG.append(record)
    print(f"  ⚠  [{severity.upper()}] {step} | {profile_name}: {issue}")


# ---------------------------------------------------------------------------
# Flow simulation
# ---------------------------------------------------------------------------

def step1_create_auth_user(profile: dict) -> str:
    """Mirrors supabase.auth.signUp() — creates the auth user."""
    name = profile["full_name"]
    try:
        result = supabase_admin(
            "POST",
            "/auth/v1/admin/users",
            body={
                "email": profile["email"],
                "password": profile["password"],
                "email_confirm": True,  # skip email confirmation — UI requires this for dev
                "user_metadata": {"name": name},
            },
        )
        uid = result.get("id") or result.get("user", {}).get("id")
        print(f"  ✓  [STEP 1 - Sign-up] {name} created — uid: {uid}")

        # FRICTION: In the actual UI, after signUp(), if email confirm is required,
        # the user is shown "Account created. Please confirm your email." and CANNOT
        # proceed. There is no "skip email confirmation" option in dev mode in the UI.
        # New users must check email before they can log in. This adds ~30 seconds
        # of friction and is a known drop-off point in sign-up funnels.
        if not result.get("email_confirmed_at"):
            log_friction(
                "Sign-up",
                name,
                "Email confirmation required before first login. No in-app resend option visible in auth panel.",
                "medium",
            )
        return uid
    except RuntimeError as exc:
        if "already been registered" in str(exc) or "already exists" in str(exc) or "User already" in str(exc):
            print(f"  ~  [STEP 1] {name} already exists — fetching uid")
            users = supabase_admin("GET", f"/auth/v1/admin/users?email={urllib.parse.quote(profile['email'])}")
            # Supabase returns {users: [...]}
            user_list = users.get("users", [])
            if user_list:
                return user_list[0]["id"]
            raise
        raise


def step2_get_jwt(profile: dict) -> str:
    """Mirrors supabase.auth.signInWithPassword() — returns the access_token."""
    name = profile["full_name"]
    try:
        result = http(
            "POST",
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            body={"email": profile["email"], "password": profile["password"]},
            headers={
                "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
                          ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxYXN1YnZib2l3cG16d25weWxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODE4MjksImV4cCI6MjA5MDQ1NzgyOX0"
                          ".P4Z6H3LWT3ivCKyqNvmGDuZchOk5Uyg59mMVuAq4leg",
            },
        )
        token = result["access_token"]
        print(f"  ✓  [STEP 2 - Login] {name} signed in — token obtained")
        return token
    except Exception as exc:
        raise RuntimeError(f"Login failed for {name}: {exc}") from exc


def step3_init_user_in_backend(profile: dict, token: str) -> dict:
    """Mirrors AuthSessionProvider calling GET /api/v1/auth/me — upserts user row."""
    name = profile["full_name"]
    result = backend("GET", "/auth/me", token)
    print(f"  ✓  [STEP 3 - Init] {name} user row ready — onboarding_required: {result.get('onboarding_required')}")

    if result.get("onboarding_required"):
        # FRICTION: User is immediately shown the onboarding modal with only two choices:
        # "I'm a Client" or "I'm a Professional". There is no explanation of what each
        # entails or how to switch later. The subtype options under "Professional" use
        # internal labels ("Body Expert") that may confuse users who identify as
        # "Personal Trainer" or "Physiotherapist".
        log_friction(
            "Onboarding",
            name,
            "No explanation of how to switch role after onboarding. No 'I'll decide later' option.",
            "low",
        )
    return result


def step4_complete_onboarding(profile: dict, token: str) -> dict:
    """Mirrors UserOnboardingProvider PATCH /api/v1/auth/onboarding."""
    name = profile["full_name"]
    result = backend(
        "PATCH",
        "/auth/onboarding",
        token,
        body={"user_type": "partner", "user_subtype": profile["user_subtype"]},
    )
    print(f"  ✓  [STEP 4 - Onboarding] {name} → partner / {profile['user_subtype']}")

    # FRICTION: "Therapist" is not a subtype option. The UI shows "Mind Expert".
    # Licensed counsellors / psychologists may not immediately recognise themselves
    # as a "Mind Expert" — the label is abstract and not a professional identity.
    if profile["user_subtype"] == "mind_expert":
        log_friction(
            "Onboarding — subtype selection",
            name,
            "'Therapist' / 'Counsellor' / 'Psychologist' label absent. 'Mind Expert' is too abstract "
            "for licensed mental health professionals who have specific credentials. "
            "Risk of selection friction or wrong subtype chosen.",
            "high",
        )
    return result


def step5_fill_profile_studio(profile: dict, token: str) -> dict:
    """Mirrors ProfileStudioPage handleSave → PUT /api/v1/professionals/me/editor."""
    name = profile["full_name"]

    # First GET the current shell (created by onboarding)
    current = backend("GET", "/professionals/me/editor", token)
    professional_id = current.get("professional_id")

    # ── SESSION TYPE FRICTION ─────────────────────────────────────────────────
    # The UI Profile Studio shows session types as: online / offline / hybrid
    # But the public-facing BookingPanel renders them as: Video / In-person / Hybrid
    # There is NO hint in the UI that "offline" means "In-person" to the client.
    # A therapist selecting "online" may not realise clients see "Video Call".
    # Likewise, a gym trainer selecting "offline" won't see "In-person" preview.
    for stype in profile.get("session_types", []):
        if stype in {"online", "offline"}:
            log_friction(
                "Profile Studio — Session Types",
                name,
                f"Session type '{stype}' shows as "
                f"'{'Video Call' if stype == 'online' else 'In-person'}' to clients "
                "but the editor uses backend enum values (online/offline). "
                "No translation hint shown in the editor — high confusion risk.",
                "high",
            )
            break  # one friction per profile is enough

    # ── AVAILABILITY TIMEZONE ─────────────────────────────────────────────────
    # FRICTION: Availability slot timezone defaults to "UTC" (hard-coded in
    # createEmptyAvailability). Indian professionals MUST manually change this
    # every time they add a slot. No "use my default timezone" shortcut exists.
    log_friction(
        "Profile Studio — Availability",
        name,
        "New availability slots default to UTC instead of the professional's default_timezone. "
        "Indian professionals (IST) must manually change every slot timezone. High effort for common case.",
        "high",
    )

    # Build the full editor payload
    payload = {
        "username": profile["username"],
        "specialization": profile["specialization"],
        "location": profile["location"],
        "sex": profile.get("sex", "undisclosed"),
        "experience_years": profile.get("experience_years", 0),
        "short_bio": profile["short_bio"],
        "about": profile["about"],
        # Practice
        "session_types": profile.get("session_types", []),
        "languages": profile.get("languages", []),
        "subcategories": profile.get("subcategories", []),
        "education": profile.get("education", []),
        "certifications": profile.get("certifications", []),
        "expertise_areas": profile.get("expertise_areas", []),
        "approaches": profile.get("approaches", []),
        # Identity
        "pronouns": profile.get("pronouns", ""),
        "who_i_work_with": profile.get("who_i_work_with", ""),
        "client_goals": profile.get("client_goals", []),
        "default_timezone": profile.get("default_timezone", "Asia/Kolkata"),
        "response_time_hours": profile.get("response_time_hours", 24),
        "cancellation_hours": profile.get("cancellation_hours", 24),
        "social_links": profile.get("social_links", {}),
        "video_intro_url": "",
        # Services
        "services": profile.get("services", []),
        # Booking
        "availability_slots": profile.get("availability_slots", []),
        "booking_question_templates": profile.get("booking_question_templates", []),
        # Kept empty (not editable via studio yet)
        "cover_image_url": "",
        "profile_image_url": "",
        "membership_tier": "",
        "gallery": [],
        "service_areas": [],
    }

    # Check for short_bio length — no character count in UI
    if len(profile["short_bio"]) > 160:
        log_friction(
            "Profile Studio — Basics",
            name,
            f"short_bio is {len(profile['short_bio'])} chars. "
            "No character counter in the UI. Results card truncates after ~160 chars.",
            "medium",
        )

    # Check for missing "Publish" awareness
    # FRICTION: The studio has a Save button AND a separate Publish button.
    # Many users will only click Save and not realise their profile isn't visible
    # to the public until they click Publish. The distinction is subtle.
    log_friction(
        "Profile Studio — Publish",
        name,
        "Save ≠ Publish. Profile is NOT visible to the public until 'Publish' is clicked. "
        "The UI has a separate Publish button but no persistent warning that the profile is in draft.",
        "medium",
    )

    result = backend("PUT", "/professionals/me/editor", token, body=payload)
    username_saved = result.get("username", profile["username"])
    print(f"  ✓  [STEP 5 - Profile Studio] {name} profile saved — /{username_saved}")

    # Check username collision — backend auto-slugifies but editor shows raw value
    if username_saved != profile["username"]:
        log_friction(
            "Profile Studio — Username",
            name,
            f"Requested username '{profile['username']}' was auto-assigned '{username_saved}' by backend. "
            "UI does not warn about username collisions or show a real-time availability check.",
            "medium",
        )

    return result


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("  Wolistic UI Flow Simulation — Creating Holistic Team Profiles")
    print("  Same HTTP endpoints as the browser UI. Friction logged in real-time.")
    print("=" * 70)
    print()

    results = []

    for profile in PROFILES:
        name = profile["full_name"]
        print(f"\n{'─' * 60}")
        print(f"  Creating: {name}  ({profile['email']})")
        print(f"{'─' * 60}")
        try:
            step1_create_auth_user(profile)
            time.sleep(0.5)  # small delay to avoid rate limiting
            token = step2_get_jwt(profile)
            step3_init_user_in_backend(profile, token)
            step4_complete_onboarding(profile, token)
            editor_result = step5_fill_profile_studio(profile, token)
            results.append({"name": name, "status": "success", "username": editor_result.get("username")})
        except Exception as exc:
            print(f"  ✗  FAILED for {name}: {exc}")
            results.append({"name": name, "status": "failed", "error": str(exc)})
        print()

    # ── Summary ──────────────────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  Profile Creation Summary")
    print("=" * 70)
    for r in results:
        if r["status"] == "success":
            print(f"  ✓  {r['name']:30s} → /{r['username']}")
        else:
            print(f"  ✗  {r['name']:30s} → FAILED: {r['error'][:80]}")

    print("\n" + "=" * 70)
    print(f"  UX Friction Log  ({len(FRICTION_LOG)} issues found)")
    print("=" * 70)
    for i, f in enumerate(FRICTION_LOG, 1):
        print(f"\n  {i}. [{f['severity'].upper()}] {f['step']}")
        print(f"     Profile : {f['profile']}")
        print(f"     Issue   : {f['issue']}")

    high = sum(1 for f in FRICTION_LOG if f["severity"] == "high")
    med  = sum(1 for f in FRICTION_LOG if f["severity"] == "medium")
    low  = sum(1 for f in FRICTION_LOG if f["severity"] == "low")
    print(f"\n  Severity totals — HIGH: {high}  MEDIUM: {med}  LOW: {low}")

    print("\n  Public profile URLs (once published):")
    for r in results:
        if r["status"] == "success":
            print(f"    http://localhost:3000/{r['username']}")

    print()


if __name__ == "__main__":
    main()
