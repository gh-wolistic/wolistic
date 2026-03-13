"""create wolistic content tables and seed sample data

Revision ID: 20260313_0009
Revises: 20260313_0008
Create Date: 2026-03-13 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260313_0009"
down_revision: Union[str, None] = "20260313_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE IF NOT EXISTS wolistic_products (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL,
        image_url   TEXT,
        category    VARCHAR(100),
        brand       VARCHAR(255),
        description TEXT,
        price       INTEGER NOT NULL DEFAULT 0,
        tags        TEXT[],
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order  INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS wolistic_services (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(255) NOT NULL,
        type        VARCHAR(100) NOT NULL,
        location    VARCHAR(255) NOT NULL,
        tags        TEXT[],
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order  INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS wolistic_articles (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title       VARCHAR(500) NOT NULL,
        read_time   VARCHAR(50) NOT NULL DEFAULT '5 min read',
        tags        TEXT[],
        is_active   BOOLEAN NOT NULL DEFAULT TRUE,
        sort_order  INTEGER NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """)

    # ── Seed products ──────────────────────────────────────────────────────────
    op.execute("""
    INSERT INTO wolistic_products (name, image_url, category, brand, description, price, tags, sort_order)
    VALUES
        ('Whey Protein Isolate',
         'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=800&q=80',
         'Supplements', 'MuscleBlaze',
         'High-quality whey protein isolate for muscle recovery and lean gains.',
         2499,
         ARRAY['protein','fitness','muscle','strength','gym','workout','supplement'],
         1),

        ('Omega-3 Fish Oil',
         'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
         'Supplements', 'HealthKart',
         'Premium fish oil capsules supporting heart, brain, and joint health.',
         699,
         ARRAY['omega3','nutrition','diet','heart','brain','health','supplement'],
         2),

        ('Yoga Mat - Premium',
         'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80',
         'Equipment', 'Boldfit',
         'Anti-slip, eco-friendly 6mm yoga mat for all levels.',
         1299,
         ARRAY['yoga','fitness','flexibility','mind','wellness','exercise'],
         3),

        ('Resistance Bands Set',
         'https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?auto=format&fit=crop&w=800&q=80',
         'Equipment', 'Strauss',
         'Set of 5 resistance bands for strength training and rehabilitation.',
         799,
         ARRAY['strength','resistance','fitness','gym','workout','muscle','training'],
         4),

        ('Multivitamin Daily',
         'https://images.unsplash.com/photo-1550572017-edd951b55104?auto=format&fit=crop&w=800&q=80',
         'Supplements', 'Himalaya',
         'Complete daily multivitamin with 23 essential nutrients.',
         549,
         ARRAY['vitamin','nutrition','diet','health','immunity','supplement'],
         5),

        ('Foam Roller',
         'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
         'Recovery', 'Nivia',
         'High-density foam roller for muscle recovery and myofascial release.',
         999,
         ARRAY['recovery','muscle','fitness','massage','therapy','pain'],
         6),

        ('Meditation Cushion',
         'https://images.unsplash.com/photo-1600618528240-fb9fc964b853?auto=format&fit=crop&w=800&q=80',
         'Wellness', 'Yogablock',
         'Buckwheat-filled zafu cushion for comfortable long meditation sessions.',
         1199,
         ARRAY['meditation','mind','yoga','mental health','calm','wellness','stress'],
         7),

        ('Protein Meal Prep Box',
         'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
         'Nutrition', 'FreshBox',
         'Weekly healthy meal prep boxes designed by certified nutritionists.',
         3299,
         ARRAY['meal','diet','nutrition','food','weight loss','health'],
         8)
    ON CONFLICT DO NOTHING;
    """)

    # ── Seed services ──────────────────────────────────────────────────────────
    op.execute("""
    INSERT INTO wolistic_services (title, type, location, tags, sort_order)
    VALUES
        ('Ananda Spa & Wellness Retreat',
         'Holistic Wellness Center',
         'Rishikesh, Uttarakhand',
         ARRAY['yoga','meditation','ayurveda','detox','mind','wellness','stress','retreat'],
         1),

        ('Cult.fit Fitness Studio',
         'Gym & Fitness Studio',
         'Bengaluru, Karnataka',
         ARRAY['gym','fitness','strength','hiit','yoga','workout','weight loss'],
         2),

        ('Fortis Nutrition Clinic',
         'Clinical Nutrition Center',
         'Mumbai, Maharashtra',
         ARRAY['nutrition','diet','dietitian','weight loss','diabetes','gut','food'],
         3),

        ('Art of Living Foundation',
         'Yoga & Meditation Center',
         'Bangalore, Karnataka',
         ARRAY['yoga','breathing','meditation','mind','stress','wellness','pranayama'],
         4),

        ('Physio World',
         'Physiotherapy Center',
         'Delhi, NCR',
         ARRAY['physiotherapy','pain','rehabilitation','posture','recovery','body','spine'],
         5),

        ('Kaya Skin & Body Clinic',
         'Dermatology & Aesthetics',
         'Hyderabad, Telangana',
         ARRAY['skin','body','dermatology','wellness','hair','beauty','health'],
         6)
    ON CONFLICT DO NOTHING;
    """)

    # ── Seed articles ──────────────────────────────────────────────────────────
    op.execute("""
    INSERT INTO wolistic_articles (title, read_time, tags, sort_order)
    VALUES
        ('The Science of Protein: How Much Do You Really Need?',
         '6 min read',
         ARRAY['protein','nutrition','muscle','diet','fitness','supplement'],
         1),

        ('10 Mindfulness Practices for Busy Professionals',
         '5 min read',
         ARRAY['mindfulness','meditation','mind','stress','mental health','focus'],
         2),

        ('Building Strength After 40: A Complete Guide',
         '8 min read',
         ARRAY['strength','fitness','muscle','age','workout','training','body'],
         3),

        ('Gut Health: The Foundation of Your Wellness Journey',
         '7 min read',
         ARRAY['gut','nutrition','diet','digestive','health','microbiome','food'],
         4),

        ('Yoga for Weight Loss: Myths vs Reality',
         '5 min read',
         ARRAY['yoga','weight loss','fitness','flexibility','mind','body','wellness'],
         5),

        ('How to Read Supplement Labels Without Getting Confused',
         '4 min read',
         ARRAY['supplement','protein','nutrition','diet','fitness','health'],
         6),

        ('The Sleep-Recovery Connection Every Athlete Should Know',
         '6 min read',
         ARRAY['sleep','recovery','fitness','muscle','performance','health'],
         7),

        ('Ayurvedic Diet Principles for Modern Life',
         '7 min read',
         ARRAY['ayurveda','diet','nutrition','wellness','food','health','mind'],
         8)
    ON CONFLICT DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS wolistic_articles CASCADE;")
    op.execute("DROP TABLE IF EXISTS wolistic_services CASCADE;")
    op.execute("DROP TABLE IF EXISTS wolistic_products CASCADE;")
