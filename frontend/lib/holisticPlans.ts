export type HolisticPlanExpert = {
  id: string;
  name: string;
  role: string;
  image: string;
};

export type HolisticPlanSuggestion = {
  id: string;
  title: string;
  assignmentStatus: "recommended" | "alternative";
  packagePrice: string;
  schedule: string;
  includes: string[];
  sessionBreakdown?: {
    totalSessions: number;
    body: { count: number; format?: string };
    diet: { count: number; followups?: string };
    mind: { count: number; label?: string };
  };
  experts: HolisticPlanExpert[];
};

export const fallbackHolisticPlans: HolisticPlanSuggestion[] = [
  {
    id: "plan-1",
    title: "ADHD focus reset (mind-forward)",
    assignmentStatus: "recommended",
    packagePrice: "₹5,900 / 4-week package",
    schedule: "Mon, Wed, Fri · 7:00 AM + Tue, Thu · 8:30 AM + Mon, Thu · 8:00 PM",
    includes: [
      "Mindfulness micro-sessions to regulate focus",
      "Executive function routines with daily habit anchors",
      "Strength/mobility stack tuned for attention and calm",
      "Diet tweaks to smooth energy and stabilize glucose",
      "Weekly adherence review with quick adjustments",
    ],
    sessionBreakdown: {
      totalSessions: 10,
      body: { count: 5, format: "Hybrid: 3 online · 2 offline" },
      diet: { count: 2, followups: "Includes follow-ups" },
      mind: { count: 1, label: "Mental wellness / life coach" },
    },
    experts: [
      {
        id: "bodyexpert1",
        name: "bodyexpert1",
        role: "Body Expert",
        image:
          "https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "dietexpert1",
        name: "dietexpert1",
        role: "Diet Expert",
        image:
          "https://images.unsplash.com/photo-1615109398623-88346a601842?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "mindexpert1",
        name: "mindexpert1",
        role: "Mind Expert",
        image:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
  {
    id: "plan-2",
    title: "Balanced body-mind-diet foundation",
    assignmentStatus: "recommended",
    packagePrice: "₹7,400 / 6-week package",
    schedule: "Tue, Thu, Sat · 6:30 AM + Daily nutrition follow-ups + Wed, Sun mindfulness",
    includes: [
      "Progressive strength and mobility blocks with deloads",
      "Macro-personalized diet with weekly adjustments",
      "Travel/weekend swaps and hydration guardrails",
      "Stress and sleep reset protocol with breathwork",
      "Accountability check-ins with micro-corrections",
    ],
    sessionBreakdown: {
      totalSessions: 10,
      body: { count: 5, format: "Hybrid: 3 online · 2 offline" },
      diet: { count: 2, followups: "Includes follow-ups" },
      mind: { count: 1, label: "Mental wellness / life coach" },
    },
    experts: [
      {
        id: "bodyexpert2",
        name: "bodyexpert2",
        role: "Body Expert",
        image:
          "https://images.unsplash.com/photo-1567013127542-490d757e6349?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "dietexpert2",
        name: "dietexpert2",
        role: "Diet Expert",
        image:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80",
      },
      {
        id: "mindexpert2",
        name: "mindexpert2",
        role: "Mind Expert",
        image:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
      },
    ],
  },
];
