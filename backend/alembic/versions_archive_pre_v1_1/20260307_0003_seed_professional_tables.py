"""seed professional tables and dummy data

Revision ID: 20260307_0003
Revises: 20260306_0002
Create Date: 2026-03-07 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260307_0003"
down_revision: Union[str, None] = "20260306_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------- Create tables (IF NOT EXISTS so it's safe to run even if they already exist) -------

    op.execute("""
    CREATE TABLE IF NOT EXISTS professionals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        username VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(320),
        sex VARCHAR(20),
        image TEXT,
        cover_image TEXT,
        specialization VARCHAR(255),
        category VARCHAR(100),
        location VARCHAR(255),
        rating NUMERIC(3,2) DEFAULT 0,
        review_count INTEGER NOT NULL DEFAULT 0,
        experience VARCHAR(255),
        experience_years INTEGER,
        bio TEXT,
        short_bio TEXT,
        about TEXT,
        hourly_rate INTEGER,
        price_negotiable BOOLEAN NOT NULL DEFAULT FALSE,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_online BOOLEAN NOT NULL DEFAULT FALSE,
        verification_status VARCHAR(50),
        certification_level VARCHAR(50),
        membership_tier VARCHAR(50),
        onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS professional_approaches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        approach TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professional_availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        availability VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professional_certifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        certification VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professional_expertise_areas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        area VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professional_education (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        education TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professional_gallery (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        image_url TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS professional_languages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        language VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professional_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        reviewer_name VARCHAR(255) NOT NULL,
        rating SMALLINT NOT NULL,
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS professional_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        duration VARCHAR(100),
        mode VARCHAR(50),
        price INTEGER,
        negotiable BOOLEAN NOT NULL DEFAULT FALSE,
        offer_type VARCHAR(20) NOT NULL DEFAULT 'none',
        offer_value INTEGER,
        offer_label VARCHAR(100)
    );

    CREATE TABLE IF NOT EXISTS professional_session_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        session_type VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professional_subcategories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        subcategory VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS professional_featured_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        image TEXT,
        price INTEGER,
        description TEXT
    );
    """)

    # ------- Create indexes -------
    op.execute("""
    CREATE INDEX IF NOT EXISTS ix_professionals_username ON professionals (username);
    """)

    # ------- Seed a dummy user and professional -------
    # We insert a dummy user row first (the foreign key requires it).
    op.execute("""
    INSERT INTO users (id, email, full_name)
    VALUES ('61ac785c-f576-4ef7-ac88-639997081a8b', 'dr.sarah.chen@example.com', 'Dr. Sarah Chen')
    ON CONFLICT (id) DO NOTHING;
    """)

    op.execute("""
    INSERT INTO professionals (
        id, user_id, username, name, email, sex, image, cover_image,
        specialization, category, location,
        rating, review_count, experience, experience_years,
        bio, short_bio, about,
        hourly_rate, price_negotiable, is_featured, is_online,
        verification_status, certification_level, membership_tier, onboarding_complete
    ) VALUES (
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '61ac785c-f576-4ef7-ac88-639997081a8b',
        'dr-sarah-chen',
        'Dr. Sarah Chen',
        'dr.sarah.chen@example.com',
        'Female',
        '/placeholder-professional.jpg',
        '/placeholder-cover.jpg',
        'Clinical Nutritionist & Wellness Coach',
        'Nutrition',
        'Mumbai, India',
        4.90, 127,
        '15+ years in clinical nutrition',
        15,
        'Dr. Sarah Chen is a board-certified clinical nutritionist with over 15 years of experience helping clients achieve optimal health through personalized nutrition plans and holistic wellness strategies.',
        'Board-certified clinical nutritionist with 15+ years helping clients achieve optimal health through personalized nutrition and holistic wellness.',
        'Dr. Sarah Chen specializes in evidence-based nutritional therapy, combining modern scientific research with traditional wellness practices. She has helped over 3,000 clients transform their health through customized meal plans, lifestyle modifications, and ongoing support. Her practice integrates functional medicine principles with practical, sustainable dietary changes that fit into busy lifestyles.',
        2500, false, true, true,
        'verified', 'advanced', 'premium', true
    )
    ON CONFLICT (username) DO NOTHING;
    """)

    # Professional ID for child rows
    # a1b2c3d4-e5f6-7890-abcd-ef1234567890

    _pid = "'a1b2c3d4-e5f6-7890-abcd-ef1234567890'"

    op.execute(f"""
    INSERT INTO professional_approaches (professional_id, approach) VALUES
        ({_pid}, 'I take a holistic, evidence-based approach combining clinical nutrition science with mindful eating practices. Every plan is personalized based on your unique biochemistry, lifestyle, and goals.')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_availability (professional_id, availability) VALUES
        ({_pid}, 'Monday - Saturday, 9 AM - 7 PM')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_certifications (professional_id, certification) VALUES
        ({_pid}, 'Board Certified - Clinical Nutrition (CBCN)'),
        ({_pid}, 'Certified Functional Medicine Practitioner'),
        ({_pid}, 'Registered Dietitian (RD)')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_expertise_areas (professional_id, area) VALUES
        ({_pid}, 'Weight Management'),
        ({_pid}, 'Sports Nutrition'),
        ({_pid}, 'Gut Health'),
        ({_pid}, 'Hormonal Balance'),
        ({_pid}, 'Diabetes Management'),
        ({_pid}, 'Anti-inflammatory Diets')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_education (professional_id, education) VALUES
        ({_pid}, 'Ph.D. in Nutritional Sciences - AIIMS Delhi'),
        ({_pid}, 'M.Sc. Clinical Nutrition - University of Mumbai'),
        ({_pid}, 'Certified Functional Medicine Practitioner - IFM'),
        ({_pid}, 'Advanced Certificate in Sports Nutrition - ISSN')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_gallery (professional_id, image_url, sort_order) VALUES
        ({_pid}, '/placeholder-gallery-1.jpg', 0),
        ({_pid}, '/placeholder-gallery-2.jpg', 1),
        ({_pid}, '/placeholder-gallery-3.jpg', 2),
        ({_pid}, '/placeholder-gallery-4.jpg', 3),
        ({_pid}, '/placeholder-gallery-5.jpg', 4),
        ({_pid}, '/placeholder-gallery-6.jpg', 5)
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_languages (professional_id, language) VALUES
        ({_pid}, 'English'),
        ({_pid}, 'Hindi'),
        ({_pid}, 'Mandarin')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_session_types (professional_id, session_type) VALUES
        ({_pid}, 'Video'),
        ({_pid}, 'In-Person'),
        ({_pid}, 'Chat')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_subcategories (professional_id, subcategory) VALUES
        ({_pid}, 'Clinical Nutrition'),
        ({_pid}, 'Sports Nutrition'),
        ({_pid}, 'Functional Medicine')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_services (professional_id, name, duration, mode, price, negotiable, offer_type, offer_value, offer_label) VALUES
        ({_pid}, 'Initial Consultation', '60 min', 'video', 0, false, 'none', NULL, NULL),
        ({_pid}, 'Follow-up Session', '45 min', 'video', 1800, false, 'none', NULL, NULL),
        ({_pid}, 'Comprehensive Nutrition Plan', '90 min', 'video', 4500, true, 'percent', 10, '10% off first plan'),
        ({_pid}, 'Group Workshop', '120 min', 'in-person', 1200, false, 'none', NULL, NULL)
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_featured_products (professional_id, name, image, price, description) VALUES
        ({_pid}, 'Premium Whey Protein Isolate', '/placeholder-product-1.jpg', 2499, 'High-quality whey protein for muscle recovery and daily nutrition.'),
        ({_pid}, 'Organic Multivitamin Complex', '/placeholder-product-2.jpg', 1299, 'Comprehensive daily vitamin and mineral supplement from organic sources.'),
        ({_pid}, 'Gut Health Probiotic Blend', '/placeholder-product-3.jpg', 1899, 'Advanced probiotic formula with 50 billion CFUs for digestive wellness.')
    ON CONFLICT DO NOTHING;
    """)

    op.execute(f"""
    INSERT INTO professional_reviews (professional_id, reviewer_name, rating, comment, created_at) VALUES
        ({_pid}, 'Priya Sharma', 5, 'Dr. Chen completely transformed my relationship with food. Her personalized nutrition plan helped me lose 12 kg in 4 months while feeling more energetic than ever. Highly recommend!', now() - INTERVAL '3 days'),
        ({_pid}, 'Rajesh Kumar', 5, 'The best nutritionist I have ever consulted. She takes time to understand your lifestyle and creates plans that are actually sustainable. My blood sugar levels are finally under control.', now() - INTERVAL '10 days'),
        ({_pid}, 'Anita Desai', 4, 'Very knowledgeable and professional. The sports nutrition plan she designed for my marathon training was spot on. Would have given 5 stars but scheduling could be more flexible.', now() - INTERVAL '25 days'),
        ({_pid}, 'Vikram Patel', 5, 'Dr. Chen helped me manage my gut health issues that multiple doctors could not diagnose. Her functional medicine approach was exactly what I needed.', now() - INTERVAL '45 days'),
        ({_pid}, 'Meera Nair', 5, 'Outstanding experience. The comprehensive nutrition plan was thorough and easy to follow. My energy levels and sleep have improved dramatically.', now() - INTERVAL '60 days')
    ON CONFLICT DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("DELETE FROM professional_reviews WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_featured_products WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_services WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_subcategories WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_session_types WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_languages WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_gallery WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_education WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_expertise_areas WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_certifications WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_availability WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professional_approaches WHERE professional_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM professionals WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'")
    op.execute("DELETE FROM users WHERE id = '61ac785c-f576-4ef7-ac88-639997081a8b'")

    op.execute("DROP TABLE IF EXISTS professional_featured_products")
    op.execute("DROP TABLE IF EXISTS professional_subcategories")
    op.execute("DROP TABLE IF EXISTS professional_session_types")
    op.execute("DROP TABLE IF EXISTS professional_services")
    op.execute("DROP TABLE IF EXISTS professional_reviews")
    op.execute("DROP TABLE IF EXISTS professional_languages")
    op.execute("DROP TABLE IF EXISTS professional_gallery")
    op.execute("DROP TABLE IF EXISTS professional_education")
    op.execute("DROP TABLE IF EXISTS professional_expertise_areas")
    op.execute("DROP TABLE IF EXISTS professional_certifications")
    op.execute("DROP TABLE IF EXISTS professional_availability")
    op.execute("DROP TABLE IF EXISTS professional_approaches")
    op.execute("DROP TABLE IF EXISTS professionals")
