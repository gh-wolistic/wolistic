import type {
  InfluencerResultCard,
  ProductResultCard,
  ProfessionalResultCard,
  ScopeOption,
} from "./results-types";

export const scopeOptions: ScopeOption[] = [
  {
    key: "professionals",
    label: "Professionals",
    description: "Compare verified wellness experts across body, mind, and diet.",
    isReady: true,
  },
  {
    key: "products",
    label: "Products",
    description: "Browse curated products selected for realistic wellness routines.",
    isReady: true,
  },
  {
    key: "influencers",
    label: "Influencers",
    description: "Discover evidence-led creators who educate before they promote.",
    isReady: true,
  },
  {
    key: "brands",
    label: "Brands",
    description: "Brand discovery will plug into this route in a later phase.",
    isReady: false,
  },
  {
    key: "services",
    label: "Services",
    description: "Structured service results will land here once the API is defined.",
    isReady: false,
  },
  {
    key: "wellness-centers",
    label: "Wellness Centers",
    description: "Location-based center discovery is planned for a later release.",
    isReady: false,
  },
];

export const professionalResults: ProfessionalResultCard[] = [
  {
    id: "sarah-chen",
    username: "dr-sarah-chen",
    name: "Dr. Sarah Chen",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80",
    specialization: "Integrative Nutrition",
    category: "Diet & Nutrition",
    rating: 4.9,
    location: "Bengaluru",
    approach: "Evidence-led nutrition plans with behavior-first habit coaching.",
    certifications: ["RD", "Functional Nutrition"],
    membershipLabel: "Verified Expert",
    isOnline: true,
  },
  {
    id: "meera-shah",
    username: "meera-shah",
    name: "Meera Shah",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=80",
    specialization: "Yoga Therapy",
    category: "Yoga & Mobility",
    rating: 4.8,
    location: "Mumbai",
    approach: "Mobility rebuilding through restorative flows and breath sequencing.",
    certifications: ["RYT-500", "Prenatal Yoga"],
    membershipLabel: "Top Rated",
    isOnline: false,
  },
  {
    id: "arjun-malhotra",
    username: "arjun-malhotra",
    name: "Arjun Malhotra",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80",
    specialization: "Strength & Conditioning",
    category: "Fitness & Training",
    rating: 4.7,
    location: "Delhi",
    approach: "Progressive training systems built for longevity, not short bursts.",
    certifications: ["CSCS", "Movement Coach"],
    membershipLabel: "Performance Coach",
    isOnline: true,
  },
  {
    id: "naina-iyer",
    username: "naina-iyer",
    name: "Naina Iyer",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
    specialization: "Mindful Life Coaching",
    category: "Life Coaching",
    rating: 4.9,
    location: "Hyderabad",
    approach: "Clarity-focused sessions for routines, priorities, and emotional resilience.",
    certifications: ["ICF", "Mindfulness"],
    membershipLabel: "Featured",
    isOnline: false,
  },
  {
    id: "kabir-kapoor",
    username: "kabir-kapoor",
    name: "Kabir Kapoor",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
    specialization: "Mental Wellness Coaching",
    category: "Mental Wellness",
    rating: 4.6,
    location: "Pune",
    approach: "Practical stress navigation with routines, boundaries, and accountability.",
    certifications: ["CBT Skills", "Wellness Coach"],
    isOnline: true,
  },
  {
    id: "anaya-rao",
    username: "anaya-rao",
    name: "Anaya Rao",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=80",
    specialization: "Posture & Recovery",
    category: "Fitness & Training",
    rating: 4.8,
    location: "Chennai",
    approach: "Recovery-centered programming for desk workers and active professionals.",
    certifications: ["NASM", "Mobility Specialist"],
    membershipLabel: "Recovery Specialist",
    isOnline: false,
  },
];

export const productResults: ProductResultCard[] = [
  {
    id: "daily-greens",
    name: "Daily Greens Blend",
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80",
    category: "Supplements",
    description: "A greens blend positioned for daily nutrition support and routine consistency.",
    brandName: "Nourish Lab",
    rating: 4.8,
    price: 1499,
    isFeatured: true,
    externalUrl: "https://example.com/products/daily-greens",
  },
  {
    id: "core-bands",
    name: "Core Resistance Band Set",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
    category: "Fitness Equipment",
    description: "Compact resistance tools suited for home sessions, travel, and low-space routines.",
    brandName: "Move Better",
    rating: 4.7,
    price: 899,
    externalUrl: "https://example.com/products/core-bands",
  },
  {
    id: "calm-mist",
    name: "Calm Sleep Mist",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
    category: "Accessories & Lifestyle",
    description: "A bedside ritual product designed to support wind-down routines and better sleep cues.",
    brandName: "Evening Ritual",
    rating: 4.5,
    price: 699,
    externalUrl: "https://example.com/products/calm-mist",
  },
  {
    id: "recovery-roller",
    name: "Recovery Roller",
    image:
      "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=1200&q=80",
    category: "Recovery Equipment",
    description: "Textured recovery roller for post-session decompression and mobility maintenance.",
    brandName: "Align Works",
    rating: 4.9,
    price: 1199,
    isFeatured: true,
    externalUrl: "https://example.com/products/recovery-roller",
  },
];

export const influencerResults: InfluencerResultCard[] = [
  {
    id: "aisha-mehta",
    name: "Aisha Mehta",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=1200&q=80",
    focus: "Evidence-Based Fitness",
    followerCount: 182000,
    content: "Breaks down training myths and translates research into usable daily habits.",
  },
  {
    id: "rahul-sen",
    name: "Rahul Sen",
    image:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=1200&q=80",
    focus: "Nutrition Education",
    followerCount: 96000,
    content: "Explains labels, meal structure, and sustainable nutrition without fad framing.",
  },
  {
    id: "tara-malik",
    name: "Tara Malik",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=1200&q=80",
    focus: "Mental Wellness",
    followerCount: 124000,
    content: "Creates grounded content on nervous-system regulation, routines, and emotional hygiene.",
  },
  {
    id: "dev-bhatia",
    name: "Dev Bhatia",
    image:
      "https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=1200&q=80",
    focus: "Mobility & Recovery",
    followerCount: 73000,
    content: "Teaches recovery basics, movement prep, and consistency strategies for busy schedules.",
  },
];