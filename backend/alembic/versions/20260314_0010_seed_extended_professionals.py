"""seed extended wellness professionals

Revision ID: 20260314_0010
Revises: 20260313_0009
Create Date: 2026-03-14 00:00:00.000000

"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Sequence, Union
import uuid

import sqlalchemy as sa
from alembic import op


revision: str = "20260314_0010"
down_revision: Union[str, None] = "20260313_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PROFILE_TEMPLATES: dict[str, dict[str, Any]] = {
    "dietitian": {
        "specialization": "Clinical Dietitian",
        "category": "Diet & Nutrition",
        "user_subtype": "diet_expert",
        "approach_title": "Practical nutrition planning",
        "approach_description": "Evidence-led food routines that are realistic enough to sustain through work, family, and travel.",
        "expertise": [
            ("Meal Planning", "Clear nutrition systems that fit daily life."),
            ("Metabolic Health", "Improving energy, labs, and long-term adherence."),
            ("Habit Change", "Small wins that compound into sustainable results."),
        ],
        "certifications": [
            ("Registered Dietitian", "Indian Dietetic Association", 2016),
            ("Certified Lifestyle Coach", "ACE", 2019),
        ],
        "education": [
            "M.Sc. Clinical Nutrition",
            "B.Sc. Food Science and Dietetics",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person", "Chat"],
        "subcategories": ["Clinical Nutrition", "Diet Planning", "Metabolic Health"],
        "availability": {"start_day": 1, "end_day": 5, "start": "09:00", "end": "18:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Initial Nutrition Consultation",
                "brief": "Assessment of routines, symptoms, and goals.",
                "mode": "video",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 2200,
                "offers": "Includes a starter meal audit",
                "negotiable": False,
                "offer_type": "percentage",
                "offer_value": 10,
                "offer_label": "10% off first consult",
            },
            {
                "name": "Follow-up Review",
                "brief": "Progress review with plan adjustments.",
                "mode": "video",
                "duration_value": 45,
                "duration_unit": "minute",
                "price": 1500,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Balanced Grocery Checklist",
            "price": 499,
            "description": "A practical shopping guide for healthier weekly meal prep.",
        },
    },
    "sports_dietitian": {
        "specialization": "Sports Dietitian",
        "category": "Sports Nutrition",
        "user_subtype": "diet_expert",
        "approach_title": "Performance nutrition coaching",
        "approach_description": "Structured fueling strategies designed around training load, recovery windows, and body composition goals.",
        "expertise": [
            ("Sports Performance", "Fueling before, during, and after training."),
            ("Body Recomposition", "Nutrition plans aligned to strength and conditioning."),
            ("Recovery Nutrition", "Better recovery through timing and consistency."),
        ],
        "certifications": [
            ("Certified Sports Nutritionist", "ISSN", 2020),
            ("Registered Dietitian", "Indian Dietetic Association", 2018),
        ],
        "education": [
            "M.Sc. Sports Nutrition",
            "B.Sc. Nutrition and Dietetics",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person"],
        "subcategories": ["Sports Nutrition", "Fat Loss", "Performance"],
        "availability": {"start_day": 1, "end_day": 6, "start": "07:00", "end": "15:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Performance Nutrition Strategy",
                "brief": "Fueling and supplement strategy for active adults.",
                "mode": "video",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 2600,
                "offers": "Workout week nutrition template included",
                "negotiable": False,
                "offer_type": "flat",
                "offer_value": 300,
                "offer_label": "Rs 300 off starter package",
            },
            {
                "name": "Competition Prep Review",
                "brief": "Short review for athletes approaching an event.",
                "mode": "video",
                "duration_value": 30,
                "duration_unit": "minute",
                "price": 1300,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Recovery Snack Blueprint",
            "price": 699,
            "description": "Simple post-workout snack combinations for strength and endurance training.",
        },
    },
    "prenatal_dietitian": {
        "specialization": "Prenatal Dietitian",
        "category": "Women\'s Wellness",
        "user_subtype": "diet_expert",
        "approach_title": "Calm and structured maternal nutrition",
        "approach_description": "Food plans built to reduce stress, improve nourishment, and support each trimester without rigid dieting.",
        "expertise": [
            ("Prenatal Nutrition", "Steady support across each trimester."),
            ("Postpartum Recovery", "Healing-focused food routines after delivery."),
            ("Iron and Protein Intake", "Targeted support for common deficiencies."),
        ],
        "certifications": [
            ("Prenatal Nutrition Specialist", "APD", 2021),
            ("Registered Dietitian", "Indian Dietetic Association", 2017),
        ],
        "education": [
            "M.Sc. Public Health Nutrition",
            "B.Sc. Clinical Nutrition",
        ],
        "languages": ["English", "Hindi", "Tamil"],
        "session_types": ["Video", "Chat"],
        "subcategories": ["Prenatal Care", "Postpartum Nutrition", "Maternal Health"],
        "availability": {"start_day": 1, "end_day": 5, "start": "10:00", "end": "17:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Prenatal Nutrition Planning",
                "brief": "Trimester-aware food planning and symptom support.",
                "mode": "video",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 2400,
                "offers": "Post-session recipe sheet included",
                "negotiable": False,
                "offer_type": "percentage",
                "offer_value": 12,
                "offer_label": "12% off first prenatal consult",
            },
            {
                "name": "Postpartum Recovery Check-in",
                "brief": "Nutrition support for recovery and energy.",
                "mode": "chat",
                "duration_value": 30,
                "duration_unit": "minute",
                "price": 1200,
                "offers": None,
                "negotiable": True,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Pregnancy Pantry Guide",
            "price": 599,
            "description": "Quick pantry swaps to make pregnancy meals easier and more nutrient dense.",
        },
    },
    "yoga_therapist": {
        "specialization": "Yoga Therapist",
        "category": "Yoga & Mobility",
        "user_subtype": "body_expert",
        "approach_title": "Breath-led therapeutic movement",
        "approach_description": "Gentle mobility and nervous system regulation practices tailored to pain, posture, and recovery needs.",
        "expertise": [
            ("Mobility", "Restoring ease in everyday movement."),
            ("Stress Recovery", "Blending breathwork with restorative yoga."),
            ("Posture Support", "Improving body awareness and movement quality."),
        ],
        "certifications": [
            ("Yoga Alliance RYT-500", "Yoga Alliance", 2018),
            ("Therapeutic Yoga Certification", "S-VYASA", 2020),
        ],
        "education": [
            "Diploma in Yoga Therapy",
            "B.A. Psychology",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person"],
        "subcategories": ["Yoga Therapy", "Breathwork", "Mobility"],
        "availability": {"start_day": 0, "end_day": 4, "start": "08:00", "end": "14:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Therapeutic Yoga Session",
                "brief": "Targeted breath and movement for pain or stress.",
                "mode": "video",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 1800,
                "offers": "Free posture screen on first booking",
                "negotiable": False,
                "offer_type": "flat",
                "offer_value": 200,
                "offer_label": "Rs 200 off intro session",
            },
            {
                "name": "Restorative Recovery Flow",
                "brief": "Calming mobility-focused recovery session.",
                "mode": "in-person",
                "duration_value": 75,
                "duration_unit": "minute",
                "price": 2200,
                "offers": None,
                "negotiable": True,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Recovery Flow Audio Pack",
            "price": 799,
            "description": "Short guided recovery practices for busy days.",
        },
    },
    "yoga_instructor": {
        "specialization": "Yoga Instructor",
        "category": "Yoga & Movement",
        "user_subtype": "body_expert",
        "approach_title": "Accessible yoga progression",
        "approach_description": "Simple, confidence-building sequences that improve strength, flexibility, and breath awareness over time.",
        "expertise": [
            ("Flexibility", "Better range of motion without forcing postures."),
            ("Foundation Strength", "Strength and control through bodyweight practice."),
            ("Breathing Patterns", "Clear cues that improve calm and focus."),
        ],
        "certifications": [
            ("Yoga Alliance RYT-200", "Yoga Alliance", 2019),
            ("Pranayama Teacher Training", "Kaivalyadhama", 2021),
        ],
        "education": [
            "B.Com.",
            "200-hour Yoga Teacher Training",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person", "Group"],
        "subcategories": ["Hatha Yoga", "Flow Yoga", "Breathwork"],
        "availability": {"start_day": 1, "end_day": 6, "start": "06:00", "end": "12:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Private Yoga Coaching",
                "brief": "Personalized yoga for flexibility and consistency.",
                "mode": "video",
                "duration_value": 50,
                "duration_unit": "minute",
                "price": 1500,
                "offers": "Beginner sequencing guide included",
                "negotiable": False,
                "offer_type": "percentage",
                "offer_value": 15,
                "offer_label": "15% off first month",
            },
            {
                "name": "Weekend Sunrise Flow",
                "brief": "Small-group energizing yoga session.",
                "mode": "group",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 800,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Morning Mobility Mini Guide",
            "price": 399,
            "description": "A quick morning yoga routine for stiffness and energy.",
        },
    },
    "strength_coach": {
        "specialization": "Strength Coach",
        "category": "Fitness & Training",
        "user_subtype": "body_expert",
        "approach_title": "Progressive strength systems",
        "approach_description": "Focused programming built around recovery, technique, and measurable progression rather than burnout.",
        "expertise": [
            ("Strength Training", "Clear progression frameworks for busy adults."),
            ("Body Recomposition", "Training and food strategies aligned to goals."),
            ("Technique Coaching", "Safer lifting through consistent cueing."),
        ],
        "certifications": [
            ("Certified Strength and Conditioning Specialist", "NSCA", 2019),
            ("Functional Training Specialist", "ACE", 2020),
        ],
        "education": [
            "B.P.Ed.",
            "Advanced Strength Coaching Certification",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person"],
        "subcategories": ["Strength Training", "Muscle Gain", "Conditioning"],
        "availability": {"start_day": 1, "end_day": 6, "start": "07:00", "end": "20:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Strength Assessment",
                "brief": "Movement screen and initial programming plan.",
                "mode": "in-person",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 2000,
                "offers": "Includes first-week training roadmap",
                "negotiable": False,
                "offer_type": "flat",
                "offer_value": 250,
                "offer_label": "Rs 250 off first assessment",
            },
            {
                "name": "Online Programming Review",
                "brief": "Weekly progression review and form feedback.",
                "mode": "video",
                "duration_value": 40,
                "duration_unit": "minute",
                "price": 1400,
                "offers": None,
                "negotiable": True,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Gym Starter Tracking Sheet",
            "price": 299,
            "description": "A simple tracker for lifts, energy, and weekly progression.",
        },
    },
    "personal_trainer": {
        "specialization": "Personal Trainer",
        "category": "Fitness Coaching",
        "user_subtype": "body_expert",
        "approach_title": "Consistency before intensity",
        "approach_description": "Training plans that emphasize routine, movement quality, and sustainable progress for everyday clients.",
        "expertise": [
            ("Weight Loss", "Gradual, repeatable routines with clear accountability."),
            ("Functional Fitness", "Movement patterns that carry into daily life."),
            ("Beginner Confidence", "Low-friction starts for people returning to exercise."),
        ],
        "certifications": [
            ("ACE Certified Personal Trainer", "ACE", 2018),
            ("TRX Suspension Training", "TRX", 2021),
        ],
        "education": [
            "B.Sc. Sports Science",
            "Diploma in Personal Training",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person", "Chat"],
        "subcategories": ["Weight Loss", "Functional Fitness", "Accountability"],
        "availability": {"start_day": 1, "end_day": 6, "start": "06:30", "end": "19:30", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Personal Training Session",
                "brief": "One-on-one training with technique and pacing support.",
                "mode": "in-person",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 1700,
                "offers": "Form checklist included",
                "negotiable": False,
                "offer_type": "percentage",
                "offer_value": 10,
                "offer_label": "10% off first three sessions",
            },
            {
                "name": "Remote Habit Coaching",
                "brief": "Weekly check-ins on training and step targets.",
                "mode": "chat",
                "duration_value": 30,
                "duration_unit": "minute",
                "price": 1000,
                "offers": None,
                "negotiable": True,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Weekly Habit Tracker",
            "price": 249,
            "description": "Simple accountability tracker for workouts, water, and sleep.",
        },
    },
    "zumba_instructor": {
        "specialization": "Zumba Instructor",
        "category": "Dance Fitness",
        "user_subtype": "body_expert",
        "approach_title": "High-energy movement that feels approachable",
        "approach_description": "Cardio-focused classes designed to build confidence, joy, and consistency instead of intimidation.",
        "expertise": [
            ("Dance Fitness", "Energy-building sessions for all fitness levels."),
            ("Cardio Endurance", "Better stamina through rhythmic movement."),
            ("Confidence Building", "Supportive classes that keep people coming back."),
        ],
        "certifications": [
            ("Licensed Zumba Instructor", "Zumba Academy", 2020),
            ("Group Fitness Instructor", "AFAA", 2021),
        ],
        "education": [
            "Certified Group Fitness Program",
            "B.A. Performing Arts",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "Group", "In-Person"],
        "subcategories": ["Zumba", "Cardio", "Dance Fitness"],
        "availability": {"start_day": 1, "end_day": 6, "start": "17:00", "end": "21:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Live Zumba Class",
                "brief": "High-energy cardio dance class.",
                "mode": "group",
                "duration_value": 45,
                "duration_unit": "minute",
                "price": 900,
                "offers": "Bring-a-friend discount available",
                "negotiable": False,
                "offer_type": "flat",
                "offer_value": 100,
                "offer_label": "Rs 100 off first class",
            },
            {
                "name": "Private Rhythm & Fitness Session",
                "brief": "Dance-based conditioning with personal coaching.",
                "mode": "video",
                "duration_value": 50,
                "duration_unit": "minute",
                "price": 1400,
                "offers": None,
                "negotiable": True,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Dance Warm-Up Playlist Pack",
            "price": 199,
            "description": "A curated playlist structure for energizing solo cardio sessions.",
        },
    },
    "pilates_coach": {
        "specialization": "Pilates & Mobility Coach",
        "category": "Mobility & Core",
        "user_subtype": "body_expert",
        "approach_title": "Control, alignment, and mobility",
        "approach_description": "Low-impact training that builds core strength, posture, and better movement mechanics.",
        "expertise": [
            ("Core Strength", "Building control and stability with precision."),
            ("Posture", "Addressing modern desk-driven movement patterns."),
            ("Mobility", "Gentle progressions for stiffness and joint comfort."),
        ],
        "certifications": [
            ("Mat Pilates Instructor", "APPI", 2019),
            ("Corrective Exercise Specialist", "NASM", 2021),
        ],
        "education": [
            "Diploma in Pilates Instruction",
            "B.Sc. Exercise Science",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person"],
        "subcategories": ["Pilates", "Core Strength", "Posture"],
        "availability": {"start_day": 1, "end_day": 5, "start": "08:00", "end": "16:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Pilates Assessment Session",
                "brief": "Core stability and movement quality assessment.",
                "mode": "video",
                "duration_value": 55,
                "duration_unit": "minute",
                "price": 1900,
                "offers": "Posture notes included",
                "negotiable": False,
                "offer_type": "percentage",
                "offer_value": 10,
                "offer_label": "10% off intro session",
            },
            {
                "name": "Desk Recovery Mobility",
                "brief": "Mobility session for stiffness and posture.",
                "mode": "in-person",
                "duration_value": 45,
                "duration_unit": "minute",
                "price": 1600,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Core Reset Routine",
            "price": 349,
            "description": "A short daily mobility-and-core sequence for desk workers.",
        },
    },
    "physiotherapist": {
        "specialization": "Physiotherapist",
        "category": "Recovery & Rehab",
        "user_subtype": "body_expert",
        "approach_title": "Rehab that transitions back to life",
        "approach_description": "Pain-reduction and rehab plans built around movement confidence, not dependency on treatment.",
        "expertise": [
            ("Pain Management", "Reducing pain while restoring confidence in movement."),
            ("Rehabilitation", "Structured recovery after injury or overload."),
            ("Posture & Movement", "Improving joint mechanics and daily comfort."),
        ],
        "certifications": [
            ("Manual Therapy Specialist", "Mulligan Concept", 2020),
            ("Sports Rehabilitation", "K11 School of Fitness Sciences", 2021),
        ],
        "education": [
            "BPT",
            "MPT in Musculoskeletal Physiotherapy",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["In-Person", "Video"],
        "subcategories": ["Physiotherapy", "Pain Relief", "Rehabilitation"],
        "availability": {"start_day": 1, "end_day": 6, "start": "10:00", "end": "19:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Physio Assessment",
                "brief": "Functional assessment for pain and movement restrictions.",
                "mode": "in-person",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 2300,
                "offers": "Home exercise plan included",
                "negotiable": False,
                "offer_type": "flat",
                "offer_value": 250,
                "offer_label": "Rs 250 off first assessment",
            },
            {
                "name": "Rehab Follow-up",
                "brief": "Progress review and exercise updates.",
                "mode": "video",
                "duration_value": 30,
                "duration_unit": "minute",
                "price": 1200,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Recovery Exercise Pack",
            "price": 599,
            "description": "Foundational recovery drills for posture, hips, and shoulders.",
        },
    },
    "adhd_therapist": {
        "specialization": "ADHD Therapist",
        "category": "Mental Wellness",
        "user_subtype": "mind_expert",
        "approach_title": "Structured therapy for real-world ADHD challenges",
        "approach_description": "Therapy that helps translate self-awareness into routines, emotional regulation, and practical coping tools.",
        "expertise": [
            ("ADHD Support", "Practical support for focus, routines, and emotional regulation."),
            ("Executive Function", "Building systems for planning and follow-through."),
            ("Stress Management", "Reducing overwhelm through realistic coping strategies."),
        ],
        "certifications": [
            ("CBT Practitioner", "Beck Institute", 2019),
            ("ADHD Clinical Services Provider", "PESI", 2022),
        ],
        "education": [
            "M.Phil. Clinical Psychology",
            "M.A. Psychology",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person", "Chat"],
        "subcategories": ["ADHD Therapy", "Executive Function", "Stress"],
        "availability": {"start_day": 1, "end_day": 5, "start": "11:00", "end": "20:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "ADHD Therapy Session",
                "brief": "Therapy focused on routines, regulation, and systems.",
                "mode": "video",
                "duration_value": 50,
                "duration_unit": "minute",
                "price": 2600,
                "offers": "Reflection worksheet included",
                "negotiable": False,
                "offer_type": "percentage",
                "offer_value": 10,
                "offer_label": "10% off first therapy consult",
            },
            {
                "name": "Routine Reset Check-in",
                "brief": "Short follow-up for planning and accountability.",
                "mode": "chat",
                "duration_value": 30,
                "duration_unit": "minute",
                "price": 1100,
                "offers": None,
                "negotiable": True,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Focus Planning Template",
            "price": 299,
            "description": "A structured weekly planner designed for ADHD-friendly prioritization.",
        },
    },
    "psychologist": {
        "specialization": "Counselling Psychologist",
        "category": "Mental Wellness",
        "user_subtype": "mind_expert",
        "approach_title": "Warm, structured talk therapy",
        "approach_description": "Collaborative therapy that balances emotional depth with clear next steps between sessions.",
        "expertise": [
            ("Anxiety Support", "Reducing spirals with practical tools and reflection."),
            ("Emotional Regulation", "Helping clients process and respond with more stability."),
            ("Work Stress", "Support for burnout, boundaries, and decision fatigue."),
        ],
        "certifications": [
            ("CBT Practitioner", "Beck Institute", 2018),
            ("Mindfulness-Based Stress Reduction", "MBSR India", 2021),
        ],
        "education": [
            "M.A. Counselling Psychology",
            "PG Diploma in CBT",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "In-Person"],
        "subcategories": ["Counselling", "Stress", "Anxiety"],
        "availability": {"start_day": 1, "end_day": 6, "start": "12:00", "end": "21:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Therapy Consultation",
                "brief": "A structured therapy session with clear goals.",
                "mode": "video",
                "duration_value": 50,
                "duration_unit": "minute",
                "price": 2300,
                "offers": "Therapy goal sheet included",
                "negotiable": False,
                "offer_type": "flat",
                "offer_value": 200,
                "offer_label": "Rs 200 off first session",
            },
            {
                "name": "Stress Recovery Follow-up",
                "brief": "Review coping systems and behaviour changes.",
                "mode": "video",
                "duration_value": 40,
                "duration_unit": "minute",
                "price": 1600,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Calm Reset Journal",
            "price": 249,
            "description": "Short guided prompts for reflection between therapy sessions.",
        },
    },
    "sleep_therapist": {
        "specialization": "Sleep Therapist",
        "category": "Mind & Recovery",
        "user_subtype": "mind_expert",
        "approach_title": "Behaviour change for better sleep",
        "approach_description": "Sleep coaching grounded in behavioural science, stress reduction, and practical bedtime systems.",
        "expertise": [
            ("Sleep Hygiene", "Improving routines that support deep rest."),
            ("Stress Recovery", "Reducing activation that keeps sleep fragmented."),
            ("Evening Routines", "Designing low-friction wind-down systems."),
        ],
        "certifications": [
            ("CBT-I Foundations", "Sleep School", 2022),
            ("Mindfulness Teacher", "MBSR India", 2020),
        ],
        "education": [
            "M.A. Psychology",
            "Sleep Coaching Certification",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "Chat"],
        "subcategories": ["Sleep Support", "Stress", "Recovery"],
        "availability": {"start_day": 1, "end_day": 5, "start": "14:00", "end": "21:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Sleep Reset Consultation",
                "brief": "Assessment of sleep blockers and routine design.",
                "mode": "video",
                "duration_value": 50,
                "duration_unit": "minute",
                "price": 2100,
                "offers": "Sleep log template included",
                "negotiable": False,
                "offer_type": "percentage",
                "offer_value": 10,
                "offer_label": "10% off first sleep consult",
            },
            {
                "name": "Evening Routine Review",
                "brief": "Follow-up to refine habits and sleep cues.",
                "mode": "chat",
                "duration_value": 25,
                "duration_unit": "minute",
                "price": 900,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Bedtime Reset Checklist",
            "price": 199,
            "description": "A short evening checklist to support calmer, more consistent sleep.",
        },
    },
    "mindfulness_coach": {
        "specialization": "Mindfulness Coach",
        "category": "Mindfulness & Stress",
        "user_subtype": "mind_expert",
        "approach_title": "Mindfulness made practical",
        "approach_description": "Simple reflection and nervous system regulation practices that fit inside demanding schedules.",
        "expertise": [
            ("Mindfulness", "Building steadier attention and awareness."),
            ("Stress Regulation", "Using breath and grounding to reduce overwhelm."),
            ("Focus Recovery", "Short routines to return attention without guilt."),
        ],
        "certifications": [
            ("Mindfulness Teacher Certification", "MBSR India", 2021),
            ("Breathwork Facilitator", "Yogic Science Institute", 2022),
        ],
        "education": [
            "B.A. Psychology",
            "Mindfulness Facilitation Program",
        ],
        "languages": ["English", "Hindi", "Bengali"],
        "session_types": ["Video", "Group", "Chat"],
        "subcategories": ["Mindfulness", "Breathwork", "Focus"],
        "availability": {"start_day": 1, "end_day": 5, "start": "08:00", "end": "18:00", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Mindfulness Coaching Session",
                "brief": "Guided attention, reflection, and stress tools.",
                "mode": "video",
                "duration_value": 45,
                "duration_unit": "minute",
                "price": 1500,
                "offers": "Audio practice included",
                "negotiable": False,
                "offer_type": "flat",
                "offer_value": 150,
                "offer_label": "Rs 150 off first session",
            },
            {
                "name": "Group Calm Practice",
                "brief": "Guided weekly mindfulness for busy professionals.",
                "mode": "group",
                "duration_value": 35,
                "duration_unit": "minute",
                "price": 700,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "2-Minute Reset Audio Set",
            "price": 249,
            "description": "Short guided audios for grounding between meetings or tasks.",
        },
    },
    "breathwork_coach": {
        "specialization": "Breathwork Coach",
        "category": "Breath & Recovery",
        "user_subtype": "mind_expert",
        "approach_title": "Breath as a recovery tool",
        "approach_description": "Breath-led sessions that support calm, focus, and better regulation without overcomplicating the practice.",
        "expertise": [
            ("Breathwork", "Using breath to shape energy and calm."),
            ("Stress Recovery", "Down-regulation practices for overloaded days."),
            ("Focus", "Short breath sequences that improve attention."),
        ],
        "certifications": [
            ("Breathwork Facilitator", "Yogic Science Institute", 2021),
            ("Trauma-Informed Breathwork", "Breathwork Africa", 2023),
        ],
        "education": [
            "Breathwork Facilitation Intensive",
            "B.A. Sociology",
        ],
        "languages": ["English", "Hindi"],
        "session_types": ["Video", "Group"],
        "subcategories": ["Breathwork", "Recovery", "Focus"],
        "availability": {"start_day": 1, "end_day": 6, "start": "07:30", "end": "11:30", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Breath Reset Session",
                "brief": "Breathwork session for calm and clarity.",
                "mode": "video",
                "duration_value": 40,
                "duration_unit": "minute",
                "price": 1400,
                "offers": "Home breath routine included",
                "negotiable": False,
                "offer_type": "percentage",
                "offer_value": 10,
                "offer_label": "10% off first reset",
            },
            {
                "name": "Weekend Recovery Circle",
                "brief": "Small-group breath-led recovery practice.",
                "mode": "group",
                "duration_value": 45,
                "duration_unit": "minute",
                "price": 650,
                "offers": None,
                "negotiable": False,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Desk Break Breathing Guide",
            "price": 149,
            "description": "Simple breath patterns for calmer transitions during the day.",
        },
    },
    "ayurveda_coach": {
        "specialization": "Ayurveda Lifestyle Coach",
        "category": "Holistic Wellness",
        "user_subtype": "mutiple_roles",
        "approach_title": "Balanced routines over rigid detox culture",
        "approach_description": "Holistic coaching that combines food, movement, and sleep routines in ways people can actually maintain.",
        "expertise": [
            ("Daily Routines", "Simple, repeatable routines for steadier energy."),
            ("Digestive Wellness", "Food and habit patterns that support comfort."),
            ("Stress Balance", "Calmer living through practical rhythm and recovery."),
        ],
        "certifications": [
            ("Ayurveda Lifestyle Consultant", "Kerala Ayurveda Academy", 2020),
            ("Wellness Coaching", "IIN", 2021),
        ],
        "education": [
            "BAMS",
            "Lifestyle Medicine Coaching Certification",
        ],
        "languages": ["English", "Hindi", "Gujarati"],
        "session_types": ["Video", "In-Person"],
        "subcategories": ["Ayurveda", "Lifestyle", "Digestive Wellness"],
        "availability": {"start_day": 1, "end_day": 5, "start": "09:30", "end": "17:30", "timezone": "Asia/Kolkata"},
        "services": [
            {
                "name": "Holistic Lifestyle Consultation",
                "brief": "Daily routine and digestion support planning.",
                "mode": "video",
                "duration_value": 60,
                "duration_unit": "minute",
                "price": 2100,
                "offers": "Routine summary included",
                "negotiable": False,
                "offer_type": "flat",
                "offer_value": 200,
                "offer_label": "Rs 200 off first consult",
            },
            {
                "name": "Seasonal Reset Follow-up",
                "brief": "Review food, sleep, and movement habits.",
                "mode": "video",
                "duration_value": 35,
                "duration_unit": "minute",
                "price": 1200,
                "offers": None,
                "negotiable": True,
                "offer_type": "none",
                "offer_value": None,
                "offer_label": None,
            },
        ],
        "product": {
            "name": "Daily Rhythm Guide",
            "price": 349,
            "description": "A gentle day-planning guide rooted in sustainable wellness habits.",
        },
    },
}


PROFILES: list[dict[str, Any]] = [
    {"slug": "ananya-menon", "name": "Ananya Menon", "template": "dietitian", "focus": "PCOS-friendly nutrition and sustainable fat loss", "location": "Bengaluru, Karnataka", "years": 9, "rating": 4.9, "review_count": 128, "membership_tier": "premium", "online": True, "languages": ["English", "Hindi", "Malayalam"]},
    {"slug": "karan-bedi", "name": "Karan Bedi", "template": "sports_dietitian", "focus": "muscle gain, recovery nutrition, and performance eating", "location": "Delhi, NCR", "years": 8, "rating": 4.8, "review_count": 104, "membership_tier": "premium", "online": True},
    {"slug": "neha-kapoor", "name": "Neha Kapoor", "template": "dietitian", "focus": "gut health, bloating support, and realistic meal prep", "location": "Mumbai, Maharashtra", "years": 7, "rating": 4.8, "review_count": 91, "membership_tier": "verified", "online": False},
    {"slug": "pooja-iyer", "name": "Pooja Iyer", "template": "prenatal_dietitian", "focus": "prenatal nourishment and postpartum recovery", "location": "Chennai, Tamil Nadu", "years": 10, "rating": 4.9, "review_count": 113, "membership_tier": "premium", "online": True},
    {"slug": "arjun-malhotra", "name": "Arjun Malhotra", "template": "strength_coach", "focus": "strength progression for busy professionals", "location": "Gurugram, Haryana", "years": 11, "rating": 4.8, "review_count": 136, "membership_tier": "premium", "online": True},
    {"slug": "rhea-saxena", "name": "Rhea Saxena", "template": "personal_trainer", "focus": "beginner-friendly fat loss and movement consistency", "location": "Pune, Maharashtra", "years": 6, "rating": 4.7, "review_count": 88, "membership_tier": "verified", "online": True},
    {"slug": "dev-malhotra", "name": "Dev Malhotra", "template": "strength_coach", "focus": "functional strength, posture, and athletic conditioning", "location": "Noida, Uttar Pradesh", "years": 8, "rating": 4.7, "review_count": 79, "membership_tier": "verified", "online": False},
    {"slug": "meera-shah", "name": "Meera Shah", "template": "yoga_therapist", "focus": "restorative yoga for stress and stiffness", "location": "Ahmedabad, Gujarat", "years": 12, "rating": 4.9, "review_count": 142, "membership_tier": "premium", "online": True},
    {"slug": "kavya-nair", "name": "Kavya Nair", "template": "yoga_instructor", "focus": "beginner yoga, flexibility, and confidence in movement", "location": "Kochi, Kerala", "years": 7, "rating": 4.8, "review_count": 97, "membership_tier": "verified", "online": True, "languages": ["English", "Hindi", "Malayalam"]},
    {"slug": "tanvi-deshpande", "name": "Tanvi Deshpande", "template": "yoga_instructor", "focus": "prenatal yoga and breath-led mobility", "location": "Pune, Maharashtra", "years": 9, "rating": 4.8, "review_count": 90, "membership_tier": "verified", "online": False},
    {"slug": "zara-khan", "name": "Zara Khan", "template": "zumba_instructor", "focus": "high-energy dance fitness for consistency and endurance", "location": "Hyderabad, Telangana", "years": 5, "rating": 4.7, "review_count": 84, "membership_tier": "verified", "online": True},
    {"slug": "pratik-singh", "name": "Pratik Singh", "template": "pilates_coach", "focus": "core strength and desk-job posture recovery", "location": "Jaipur, Rajasthan", "years": 6, "rating": 4.7, "review_count": 73, "membership_tier": "verified", "online": True},
    {"slug": "nikhil-arora", "name": "Nikhil Arora", "template": "physiotherapist", "focus": "back pain relief and post-injury rehab", "location": "Chandigarh, Punjab", "years": 13, "rating": 4.9, "review_count": 151, "membership_tier": "premium", "online": False},
    {"slug": "dr-anjali-verma", "name": "Dr. Anjali Verma", "template": "adhd_therapist", "focus": "therapy for ADHD, overwhelm, and executive dysfunction", "location": "Mumbai, Maharashtra", "years": 11, "rating": 4.9, "review_count": 134, "membership_tier": "premium", "online": True},
    {"slug": "rohan-sethi", "name": "Rohan Sethi", "template": "psychologist", "focus": "anxiety, emotional regulation, and work stress", "location": "New Delhi, Delhi", "years": 9, "rating": 4.8, "review_count": 102, "membership_tier": "premium", "online": True},
    {"slug": "dr-farah-qureshi", "name": "Dr. Farah Qureshi", "template": "sleep_therapist", "focus": "sleep routine rebuilding and stress-linked insomnia", "location": "Lucknow, Uttar Pradesh", "years": 10, "rating": 4.8, "review_count": 87, "membership_tier": "verified", "online": False},
    {"slug": "diya-sen", "name": "Diya Sen", "template": "mindfulness_coach", "focus": "mindfulness for focus recovery and calmer workdays", "location": "Kolkata, West Bengal", "years": 6, "rating": 4.7, "review_count": 69, "membership_tier": "verified", "online": True, "languages": ["English", "Hindi", "Bengali"]},
    {"slug": "rahul-joshi", "name": "Rahul Joshi", "template": "breathwork_coach", "focus": "breath-led stress recovery and better attention control", "location": "Indore, Madhya Pradesh", "years": 5, "rating": 4.6, "review_count": 58, "membership_tier": "verified", "online": True},
    {"slug": "sonal-patel", "name": "Sonal Patel", "template": "ayurveda_coach", "focus": "digestive balance, daily routines, and holistic wellness", "location": "Vadodara, Gujarat", "years": 12, "rating": 4.8, "review_count": 109, "membership_tier": "premium", "online": False, "languages": ["English", "Hindi", "Gujarati"]},
    {"slug": "ishaan-rao", "name": "Ishaan Rao", "template": "personal_trainer", "focus": "gym confidence, routine building, and strength for beginners", "location": "Bengaluru, Karnataka", "years": 7, "rating": 4.7, "review_count": 81, "membership_tier": "verified", "online": True},
]


REVIEWER_NAMES = [
    "Aarav Gupta",
    "Priyanka Nair",
    "Sana Ali",
    "Vivek Mehta",
    "Nisha Patel",
    "Kabir Shah",
    "Ritika Bose",
    "Manav Khanna",
]


def _seed_uuid(kind: str, slug: str) -> uuid.UUID:
    return uuid.uuid5(uuid.NAMESPACE_URL, f"wolistic:{kind}:{slug}")


def _parse_time(value: str):
    return datetime.strptime(value, "%H:%M").time()


def _table_exists(inspector: sa.Inspector, table_name: str) -> bool:
    return inspector.has_table(table_name)


def _get_columns(inspector: sa.Inspector, cache: dict[str, set[str]], table_name: str) -> set[str]:
    if table_name not in cache:
        cache[table_name] = {column["name"] for column in inspector.get_columns(table_name)}
    return cache[table_name]


def _get_professional_ref_column(
    inspector: sa.Inspector,
    cache: dict[str, str],
    table_name: str,
) -> str:
    if table_name not in cache:
        referred_column = "user_id"
        for fk in inspector.get_foreign_keys(table_name):
            if fk.get("referred_table") == "professionals" and fk.get("constrained_columns") == ["professional_id"]:
                referred_columns = fk.get("referred_columns") or ["user_id"]
                referred_column = referred_columns[0]
                break
        cache[table_name] = referred_column
    return cache[table_name]


def _execute_many(
    conn: sa.Connection,
    table_name: str,
    rows: list[dict[str, Any]],
    on_conflict: str | None = None,
) -> None:
    if not rows:
        return
    columns = list(rows[0].keys())
    quoted_columns = ", ".join(columns)
    bind_names = ", ".join(f":{column}" for column in columns)
    statement = f"INSERT INTO {table_name} ({quoted_columns}) VALUES ({bind_names})"
    if on_conflict:
        statement = f"{statement} {on_conflict}"
    conn.execute(sa.text(statement), rows)


def _delete_by_professional_refs(
    conn: sa.Connection,
    table_name: str,
    refs: list[uuid.UUID],
) -> None:
    if not refs:
        return
    statement = sa.text(
        f"DELETE FROM {table_name} WHERE professional_id IN :professional_ids"
    ).bindparams(sa.bindparam("professional_ids", expanding=True))
    conn.execute(statement, {"professional_ids": refs})


def _reviewer_users() -> list[dict[str, Any]]:
    users: list[dict[str, Any]] = []
    for name in REVIEWER_NAMES:
        slug = name.lower().replace(" ", "-")
        users.append(
            {
                "id": _seed_uuid("reviewer-user", slug),
                "email": f"{slug}@seed.wolistic.local",
                "full_name": name,
                "user_type": "client",
                "user_subtype": "client",
            }
        )
    return users


def _profile_user_row(profile: dict[str, Any], template: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": profile["user_id"],
        "email": f"{profile['slug']}@seed.wolistic.local",
        "full_name": profile["name"],
        "user_type": "partner",
        "user_subtype": template["user_subtype"],
    }


def _professional_row(
    profile: dict[str, Any],
    template: dict[str, Any],
    professional_columns: set[str],
) -> dict[str, Any]:
    image_url = "/placeholder-professional.jpg"
    cover_url = "/placeholder-cover.jpg"
    now = datetime.now(timezone.utc)
    last_active_at = now - timedelta(minutes=2) if profile["online"] else now - timedelta(days=2)
    short_bio = (
        f"{template['specialization']} helping clients with {profile['focus']} through clear, sustainable routines."
    )
    about = (
        f"{profile['name']} is a {template['specialization'].lower()} based in {profile['location']} focused on {profile['focus']}. "
        f"Their work combines structure, accountability, and realistic planning so progress can hold up in day-to-day life."
    )
    experience = f"{profile['years']}+ years guiding clients through {profile['focus']}"

    field_values = {
        "id": profile["professional_id"],
        "user_id": profile["user_id"],
        "username": profile["slug"],
        "name": profile["name"],
        "email": f"{profile['slug']}@seed.wolistic.local",
        "sex": profile.get("sex", "undisclosed"),
        "image": image_url,
        "cover_image": cover_url,
        "profile_image_url": image_url,
        "cover_image_url": cover_url,
        "specialization": template["specialization"],
        "category": template["category"],
        "location": profile["location"],
        "rating": profile["rating"],
        "review_count": profile["review_count"],
        "rating_avg": profile["rating"],
        "rating_count": profile["review_count"],
        "experience": experience,
        "experience_years": profile["years"],
        "bio": short_bio,
        "short_bio": short_bio,
        "about": about,
        "hourly_rate": template["services"][0]["price"],
        "price_negotiable": any(service.get("negotiable") for service in template["services"]),
        "is_featured": profile["membership_tier"] == "premium",
        "is_online": profile["online"],
        "last_active_at": last_active_at,
        "verification_status": "verified",
        "certification_level": "advanced",
        "membership_tier": profile["membership_tier"],
        "onboarding_complete": True,
        "created_at": now - timedelta(days=profile["years"] * 30),
        "updated_at": now,
    }

    return {
        column: value
        for column, value in field_values.items()
        if column in professional_columns
    }


def _professional_ref(profile: dict[str, Any], target_column: str) -> uuid.UUID:
    return profile["professional_id"] if target_column == "id" else profile["user_id"]


def _normalize_service_mode(mode: str) -> str:
    mode_key = (mode or "").strip().lower()
    if mode_key in {"video", "chat", "online"}:
        return "online"
    if mode_key in {"in-person", "in_person", "offline"}:
        return "offline"
    if mode_key in {"group", "hybrid"}:
        return "hybrid"
    return "online"


def _normalize_duration_unit(unit: str) -> str:
    unit_key = (unit or "").strip().lower()
    if unit_key in {"min", "mins", "minute", "minutes"}:
        return "mins"
    if unit_key in {"hour", "hours", "hr", "hrs"}:
        return "hours"
    if unit_key in {"day", "days"}:
        return "days"
    return "mins"


def _normalize_session_type(session_type: str) -> str:
    value = (session_type or "").strip().lower()
    if value in {"video", "chat", "online"}:
        return "online"
    if value in {"in-person", "in person", "in_person", "offline"}:
        return "offline"
    if value in {"group", "hybrid"}:
        return "hybrid"
    return "online"


def _child_rows(
    profile: dict[str, Any],
    template: dict[str, Any],
    table_name: str,
    columns: set[str],
    professional_ref: uuid.UUID,
    reviewer_users: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    if table_name == "professional_approaches":
        if "approach" in columns:
            return [{"professional_id": professional_ref, "approach": template["approach_description"]}]
        return [{"professional_id": professional_ref, "title": template["approach_title"], "description": template["approach_description"]}]

    if table_name == "professional_availability":
        availability = template["availability"]
        if "availability" in columns:
            return [
                {
                    "professional_id": professional_ref,
                    "availability": (
                        f"{availability['start_day']} to {availability['end_day']}, {availability['start']} - {availability['end']} {availability['timezone']}"
                    ),
                }
            ]
        return [
            {
                "professional_id": professional_ref,
                "day_of_week": day,
                "start_time": _parse_time(availability["start"]),
                "end_time": _parse_time(availability["end"]),
                "timezone": availability["timezone"],
            }
            for day in range(availability["start_day"], availability["end_day"] + 1)
        ]

    if table_name == "professional_certifications":
        rows = []
        for name, issuer, issued_year in template["certifications"]:
            if "certification" in columns:
                rows.append({"professional_id": professional_ref, "certification": name})
            else:
                rows.append(
                    {
                        "professional_id": professional_ref,
                        "name": name,
                        "issuer": issuer,
                        "issued_year": issued_year,
                    }
                )
        return rows

    if table_name == "professional_expertise_areas":
        rows = []
        for title, description in template["expertise"]:
            if "area" in columns:
                rows.append({"professional_id": professional_ref, "area": title})
            else:
                rows.append(
                    {
                        "professional_id": professional_ref,
                        "title": title,
                        "description": description,
                    }
                )
        return rows

    if table_name == "professional_education":
        return [{"professional_id": professional_ref, "education": item} for item in template["education"]]

    if table_name == "professional_gallery":
        gallery_rows = []
        for index in range(3):
            row = {
                "professional_id": professional_ref,
                "image_url": "/placeholder-gallery-1.jpg",
            }
            if "sort_order" in columns:
                row["sort_order"] = index
            if "display_order" in columns:
                row["display_order"] = index
            if "caption" in columns:
                row["caption"] = f"{profile['name']} session highlight {index + 1}"
            gallery_rows.append(row)
        return gallery_rows

    if table_name == "professional_languages":
        languages = profile.get("languages") or template["languages"]
        return [{"professional_id": professional_ref, "language": language} for language in languages]

    if table_name == "professional_reviews":
        now = datetime.now(timezone.utc)
        reviewer_index = _seed_uuid("reviewer-map", profile["slug"]).int % len(reviewer_users)
        reviewer_one = reviewer_users[reviewer_index]
        reviewer_two = reviewer_users[(reviewer_index + 3) % len(reviewer_users)]
        comment_one = (
            f"{profile['name']} made progress on {profile['focus']} feel practical and manageable from week one."
        )
        comment_two = (
            f"Very supportive, clear, and grounded. I appreciated how actionable the advice felt for {profile['focus']}."
        )
        legacy_mode = "reviewer_name" in columns
        if legacy_mode:
            return [
                {
                    "professional_id": professional_ref,
                    "reviewer_name": reviewer_one["full_name"],
                    "rating": 5,
                    "comment": comment_one,
                    "created_at": now - timedelta(days=7),
                },
                {
                    "professional_id": professional_ref,
                    "reviewer_name": reviewer_two["full_name"],
                    "rating": 4 if profile["rating"] < 4.8 else 5,
                    "comment": comment_two,
                    "created_at": now - timedelta(days=18),
                },
            ]
        return [
            {
                "professional_id": professional_ref,
                "reviewer_user_id": reviewer_one["id"],
                "rating": 5,
                "review_text": comment_one,
                "is_verified": True,
                "created_at": now - timedelta(days=7),
            },
            {
                "professional_id": professional_ref,
                "reviewer_user_id": reviewer_two["id"],
                "rating": 4 if profile["rating"] < 4.8 else 5,
                "review_text": comment_two,
                "is_verified": True,
                "created_at": now - timedelta(days=18),
            },
        ]

    if table_name == "professional_services":
        rows = []
        for service in template["services"]:
            normalized_mode = _normalize_service_mode(service["mode"])
            normalized_unit = _normalize_duration_unit(service["duration_unit"])
            row = {
                "professional_id": professional_ref,
                "name": service["name"],
                "mode": normalized_mode,
                "price": service["price"],
            }
            if "duration" in columns:
                row["duration"] = f"{service['duration_value']} {normalized_unit}"
            if "duration_value" in columns:
                row["duration_value"] = service["duration_value"]
            if "duration_unit" in columns:
                row["duration_unit"] = normalized_unit
            if "short_brief" in columns:
                row["short_brief"] = service["brief"]
            if "offers" in columns:
                row["offers"] = service["offers"]
            if "negotiable" in columns:
                row["negotiable"] = service["negotiable"]
            if "offer_type" in columns:
                row["offer_type"] = "percent" if service["offer_type"] == "percentage" else service["offer_type"]
            if "offer_value" in columns:
                row["offer_value"] = service["offer_value"]
            if "offer_label" in columns:
                row["offer_label"] = service["offer_label"]
            if "is_active" in columns:
                row["is_active"] = True
            rows.append(row)
        return rows

    if table_name == "professional_session_types":
        # Session type constraints vary in some deployed Supabase environments.
        # Skip seeding here to keep migration reliable across environments.
        return []

    if table_name == "professional_subcategories":
        if "subcategory" in columns:
            return [{"professional_id": professional_ref, "subcategory": name} for name in template["subcategories"]]
        return [{"professional_id": professional_ref, "name": name} for name in template["subcategories"]]

    if table_name == "professional_featured_products":
        product = template["product"]
        return [
            {
                "professional_id": professional_ref,
                "name": product["name"],
                "image": "/placeholder-product-1.jpg",
                "price": product["price"],
                "description": product["description"],
            }
        ]

    return []


def _booking_question_rows(profile: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "professional_id": profile["user_id"],
            "prompt": "What outcome do you want in the next 4-6 weeks?",
            "display_order": 1,
            "is_required": True,
            "is_active": True,
        },
        {
            "professional_id": profile["user_id"],
            "prompt": "Any schedule, food, movement, or lifestyle constraints we should plan around?",
            "display_order": 2,
            "is_required": True,
            "is_active": True,
        },
    ]


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not _table_exists(inspector, "users") or not _table_exists(inspector, "professionals"):
        return

    column_cache: dict[str, set[str]] = {}
    ref_column_cache: dict[str, str] = {}

    professionals = []
    for raw_profile in PROFILES:
        profile = dict(raw_profile)
        profile["user_id"] = _seed_uuid("professional-user", profile["slug"])
        profile["professional_id"] = _seed_uuid("professional-profile", profile["slug"])
        professionals.append(profile)

    reviewer_users = _reviewer_users()

    user_columns = _get_columns(inspector, column_cache, "users")
    user_rows = []
    for reviewer in reviewer_users:
        user_rows.append({column: value for column, value in reviewer.items() if column in user_columns})
    for profile in professionals:
        template = PROFILE_TEMPLATES[profile["template"]]
        user_rows.append(
            {
                column: value
                for column, value in _profile_user_row(profile, template).items()
                if column in user_columns
            }
        )

    _execute_many(
        conn,
        "users",
        user_rows,
        on_conflict=(
            "ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name"
            + (", user_type = EXCLUDED.user_type" if "user_type" in user_columns else "")
            + (", user_subtype = EXCLUDED.user_subtype" if "user_subtype" in user_columns else "")
        ),
    )

    professional_columns = _get_columns(inspector, column_cache, "professionals")
    professional_rows = [
        _professional_row(profile, PROFILE_TEMPLATES[profile["template"]], professional_columns)
        for profile in professionals
    ]
    update_columns = [
        column
        for column in professional_rows[0].keys()
        if column not in {"created_at"}
    ]
    on_conflict = "ON CONFLICT (username) DO UPDATE SET " + ", ".join(
        f"{column} = EXCLUDED.{column}" for column in update_columns
    )
    _execute_many(conn, "professionals", professional_rows, on_conflict=on_conflict)

    child_tables = [
        "professional_approaches",
        "professional_availability",
        "professional_certifications",
        "professional_expertise_areas",
        "professional_education",
        "professional_gallery",
        "professional_languages",
        "professional_reviews",
        "professional_services",
        "professional_session_types",
        "professional_subcategories",
        "professional_featured_products",
    ]

    for table_name in child_tables:
        if not _table_exists(inspector, table_name):
            continue
        target_column = _get_professional_ref_column(inspector, ref_column_cache, table_name)
        refs = [_professional_ref(profile, target_column) for profile in professionals]
        _delete_by_professional_refs(conn, table_name, refs)

        columns = _get_columns(inspector, column_cache, table_name)
        rows: list[dict[str, Any]] = []
        for profile in professionals:
            template = PROFILE_TEMPLATES[profile["template"]]
            rows.extend(
                _child_rows(
                    profile,
                    template,
                    table_name,
                    columns,
                    _professional_ref(profile, target_column),
                    reviewer_users,
                )
            )
        _execute_many(conn, table_name, rows)

    if _table_exists(inspector, "booking_question_templates"):
        booking_delete = sa.text(
            "DELETE FROM booking_question_templates WHERE professional_id IN :professional_ids"
        ).bindparams(sa.bindparam("professional_ids", expanding=True))
        conn.execute(
            booking_delete,
            {"professional_ids": [profile["user_id"] for profile in professionals]},
        )
        booking_rows = []
        for profile in professionals:
            booking_rows.extend(_booking_question_rows(profile))
        _execute_many(
            conn,
            "booking_question_templates",
            booking_rows,
            on_conflict=(
                "ON CONFLICT (professional_id, display_order) DO UPDATE SET "
                "prompt = EXCLUDED.prompt, is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active"
            ),
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if not _table_exists(inspector, "professionals"):
        return

    column_cache: dict[str, set[str]] = {}
    ref_column_cache: dict[str, str] = {}

    professionals = []
    for raw_profile in PROFILES:
        profile = dict(raw_profile)
        profile["user_id"] = _seed_uuid("professional-user", profile["slug"])
        profile["professional_id"] = _seed_uuid("professional-profile", profile["slug"])
        professionals.append(profile)

    child_tables = [
        "professional_reviews",
        "professional_featured_products",
        "professional_services",
        "professional_subcategories",
        "professional_session_types",
        "professional_languages",
        "professional_gallery",
        "professional_education",
        "professional_expertise_areas",
        "professional_certifications",
        "professional_availability",
        "professional_approaches",
    ]

    for table_name in child_tables:
        if not _table_exists(inspector, table_name):
            continue
        target_column = _get_professional_ref_column(inspector, ref_column_cache, table_name)
        refs = [_professional_ref(profile, target_column) for profile in professionals]
        _delete_by_professional_refs(conn, table_name, refs)

    if _table_exists(inspector, "booking_question_templates"):
        booking_delete = sa.text(
            "DELETE FROM booking_question_templates WHERE professional_id IN :professional_ids"
        ).bindparams(sa.bindparam("professional_ids", expanding=True))
        conn.execute(
            booking_delete,
            {"professional_ids": [profile["user_id"] for profile in professionals]},
        )

    delete_professionals = sa.text(
        "DELETE FROM professionals WHERE username IN :usernames"
    ).bindparams(sa.bindparam("usernames", expanding=True))
    conn.execute(
        delete_professionals,
        {"usernames": [profile["slug"] for profile in professionals]},
    )

    if _table_exists(inspector, "users"):
        reviewer_emails = [f"{name.lower().replace(' ', '-')}@seed.wolistic.local" for name in REVIEWER_NAMES]
        professional_emails = [f"{profile['slug']}@seed.wolistic.local" for profile in professionals]
        delete_users = sa.text(
            "DELETE FROM users WHERE email IN :emails"
        ).bindparams(sa.bindparam("emails", expanding=True))
        conn.execute(
            delete_users,
            {"emails": reviewer_emails + professional_emails},
        )

