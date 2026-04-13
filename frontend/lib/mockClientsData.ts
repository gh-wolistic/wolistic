// Mock data for Client Manager v2 - Realistic wellness scenarios

import { 
  Client, 
  Routine, 
  FollowUp, 
  UpcomingSession, 
  DashboardMetrics,
  RoutineItem 
} from '@/types/routines';

// Mock Clients
export const mockClients: Client[] = [
  {
    id: 1,
    name: 'Amit Kumar',
    email: 'amit.kumar@email.com',
    phone: '+91 98765 43210',
    initials: 'AK',
    status: 'active',
    acquisition_source: 'organic_search',
    source_metadata: {
      search_query: 'personal trainer for muscle building',
      referrer_url: '/search/fitness'
    },
    enrolled_date: '2025-11-15',
    total_sessions: 12,
    completed_sessions: 8,
    next_session: {
      date: '2026-04-14',
      time: '3:30 PM',
      location: 'Elite Fitness Gym',
      type: 'offline'
    },
    attendance_count: 6,
    attendance_total: 8,
    current_streak_weeks: 3,
    lifetime_value: 45000,
    goals: 'Weight Loss and Muscle Building',
    preferences: 'Early morning sessions, intense workout pacing',
    medical_history: 'Mild knee pain from past sports injury. Cleared for activity.',
    dietary_requirements: 'Strictly vegetarian diet, high in protein',
    pending_followups: 2
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'priya.sharma@techcorp.com',
    phone: '+91 98234 56789',
    initials: 'PS',
    status: 'active',
    acquisition_source: 'corporate_event',
    source_metadata: {
      event_name: 'TechCorp Wellness Week',
      employee_id: 'EMP12345'
    },
    enrolled_date: '2026-01-10',
    total_sessions: 16,
    completed_sessions: 12,
    next_session: {
      date: '2026-04-15',
      time: '10:00 AM',
      location: 'Online via Zoom',
      type: 'online'
    },
    attendance_count: 12,
    attendance_total: 12,
    current_streak_weeks: 5,
    lifetime_value: 32000,
    goals: 'Stress management and flexibility',
    preferences: 'Online sessions, yoga and meditation focus',
    medical_history: 'None reported',
    dietary_requirements: 'No restrictions',
    pending_followups: 0
  },
  {
    id: 3,
    name: 'Rohan Verma',
    email: 'rohan.v@gmail.com',
    phone: '+91 99123 45678',
    initials: 'RV',
    status: 'active',
    acquisition_source: 'wolistic_recommendation',
    source_metadata: {
      recommended_experts: ['uuid-1', 'uuid-2', 'uuid-3'],
      recommendation_reason: 'Specialized in strength training for beginners'
    },
    enrolled_date: '2026-02-20',
    total_sessions: 8,
    completed_sessions: 5,
    next_session: {
      date: '2026-04-16',
      time: '6:00 PM',
      location: 'PowerHouse Gym',
      type: 'offline'
    },
    attendance_count: 4,
    attendance_total: 5,
    current_streak_weeks: 2,
    lifetime_value: 18000,
    goals: 'Build strength and confidence',
    preferences: 'Evening sessions, compound movements',
    medical_history: 'None',
    dietary_requirements: 'Non-vegetarian',
    pending_followups: 1
  },
  {
    id: 4,
    name: 'Sneha Patel',
    email: 'sneha.patel@yahoo.com',
    phone: '+91 97654 32109',
    initials: 'SP',
    status: 'paused',
    acquisition_source: 'expert_invite',
    source_metadata: {
      invitation_sent_at: '2025-12-01T10:00:00Z',
      invitation_accepted_at: '2025-12-03T14:30:00Z'
    },
    enrolled_date: '2025-12-05',
    total_sessions: 10,
    completed_sessions: 7,
    attendance_count: 5,
    attendance_total: 7,
    current_streak_weeks: 0,
    lifetime_value: 25000,
    goals: 'Postnatal fitness recovery',
    preferences: 'Low-impact exercises, flexible timings',
    medical_history: 'Postnatal (6 months), doctor clearance obtained',
    dietary_requirements: 'Lactose intolerant',
    pending_followups: 1
  },
  {
    id: 5,
    name: 'Vikram Singh',
    email: 'vikram.singh@outlook.com',
    phone: '+91 98765 11111',
    initials: 'VS',
    status: 'active',
    acquisition_source: 'organic_search',
    source_metadata: {
      search_query: 'nutrition coach for weight loss',
      referrer_url: '/professionals/nutrition'
    },
    enrolled_date: '2026-03-01',
    total_sessions: 6,
    completed_sessions: 6,
    next_session: {
      date: '2026-04-17',
      time: '12:00 PM',
      location: 'Online via Google Meet',
      type: 'online'
    },
    attendance_count: 6,
    attendance_total: 6,
    current_streak_weeks: 4,
    lifetime_value: 15000,
    goals: 'Sustainable weight loss through nutrition',
    preferences: 'Weekly check-ins, meal planning support',
    medical_history: 'Type 2 diabetes (controlled)',
    dietary_requirements: 'Low-carb preference',
    pending_followups: 0
  }
];

// Mock Routines
export const mockRoutines: Routine[] = [
  {
    id: 1,
    client_id: 1,
    title: '4-Week Hypertrophy Program',
    description: 'Progressive muscle building with compound movements and strategic volume increase',
    status: 'published',
    source_type: 'manual',
    duration_weeks: 4,
    current_week: 2,
    progress_percentage: 50,
    items: [
      {
        id: 'item-1',
        type: 'hydration',
        order: 1,
        title: 'Drink 3L of water',
        completed: true,
        completed_at: '2026-04-13T09:00:00Z'
      },
      {
        id: 'item-2',
        type: 'mobility',
        order: 2,
        title: '15-mins morning mobility',
        instructions: 'Focus on hip and shoulder mobility drills',
        completed: true,
        completed_at: '2026-04-13T06:30:00Z'
      },
      {
        id: 'item-3',
        type: 'exercise',
        order: 3,
        title: 'Barbell squats',
        instructions: 'Keep chest up, drive through heels, full depth',
        sets: 4,
        reps: 8,
        rest_seconds: 90,
        intensity: 'intense',
        completed: false
      },
      {
        id: 'item-4',
        type: 'exercise',
        order: 4,
        title: 'Romanian Deadlifts',
        instructions: 'Hinge at hips, slight knee bend, feel hamstring stretch',
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        intensity: 'moderate',
        completed: false
      },
      {
        id: 'item-5',
        type: 'mobility',
        order: 5,
        title: 'Evening stretching',
        instructions: '10 minutes full-body static stretches',
        completed: false
      }
    ],
    created_at: '2026-03-15T10:00:00Z',
    published_at: '2026-03-16T08:00:00Z',
    approved_at: '2026-03-16T08:00:00Z'
  },
  {
    id: 2,
    client_id: 2,
    title: 'Stress Relief & Flexibility - 6 Weeks',
    description: 'Gentle yoga and meditation practice for corporate stress management',
    status: 'published',
    source_type: 'manual',
    duration_weeks: 6,
    current_week: 3,
    progress_percentage: 50,
    items: [
      {
        id: 'item-6',
        type: 'mobility',
        order: 1,
        title: 'Morning breathwork & stretching',
        instructions: '10 minutes deep breathing with gentle stretches',
        completed: true,
        completed_at: '2026-04-13T07:00:00Z'
      },
      {
        id: 'item-7',
        type: 'mobility',
        order: 2,
        title: 'Cat-Cow stretches',
        instructions: 'Slow, controlled spinal movements',
        sets: 2,
        reps: 10,
        intensity: 'light',
        completed: true,
        completed_at: '2026-04-13T07:15:00Z'
      },
      {
        id: 'item-8',
        type: 'mobility',
        order: 3,
        title: 'Evening wind-down stretching',
        instructions: 'Full body relaxation stretches for 15 minutes',
        completed: false
      }
    ],
    created_at: '2026-01-12T10:00:00Z',
    published_at: '2026-01-13T09:00:00Z',
    approved_at: '2026-01-13T09:00:00Z'
  },
  {
    id: 3,
    client_id: 3,
    title: 'Beginner Strength Foundation',
    description: 'Build fundamental strength with bodyweight and light resistance',
    status: 'published',
    source_type: 'manual',
    duration_weeks: 8,
    current_week: 4,
    progress_percentage: 50,
    items: [
      {
        id: 'item-9',
        type: 'exercise',
        order: 1,
        title: 'Push-ups (modified if needed)',
        instructions: 'Keep core tight, full range of motion',
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        intensity: 'moderate',
        completed: false
      },
      {
        id: 'item-10',
        type: 'exercise',
        order: 2,
        title: 'Goblet squats',
        instructions: 'Hold dumbbell at chest, squat to parallel',
        sets: 3,
        reps: 12,
        rest_seconds: 60,
        intensity: 'moderate',
        completed: false
      }
    ],
    created_at: '2026-02-22T10:00:00Z',
    published_at: '2026-02-23T08:00:00Z',
    approved_at: '2026-02-23T08:00:00Z'
  },
  // Template Routines (no client_id, isTemplate: true)
  {
    id: 101,
    isTemplate: true,
    assigned_count: 3,
    title: 'Beginner Strength Foundation',
    description: 'Perfect for new clients starting their fitness journey. Focus on form and foundational movements.',
    status: 'published',
    source_type: 'manual',
    duration_weeks: 4,
    current_week: 0,
    progress_percentage: 0,
    items: [
      {
        id: 'template-item-1',
        type: 'hydration',
        order: 1,
        title: 'Daily water goal: 2.5L',
        completed: false
      },
      {
        id: 'template-item-2',
        type: 'mobility',
        order: 2,
        title: 'Morning mobility routine',
        instructions: '5-10 minutes joint mobility and dynamic stretches',
        completed: false
      },
      {
        id: 'template-item-3',
        type: 'exercise',
        order: 3,
        title: 'Bodyweight squats',
        instructions: 'Focus on depth and control, bodyweight only',
        sets: 3,
        reps: 12,
        rest_seconds: 60,
        intensity: 'light',
        completed: false
      },
      {
        id: 'template-item-4',
        type: 'exercise',
        order: 4,
        title: 'Push-ups (modified if needed)',
        instructions: 'Chest to floor, full extension, knees down if necessary',
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        intensity: 'light',
        completed: false
      },
      {
        id: 'template-item-5',
        type: 'exercise',
        order: 5,
        title: 'Plank hold',
        instructions: 'Maintain neutral spine, squeeze glutes',
        sets: 3,
        reps: 30, // seconds
        rest_seconds: 60,
        intensity: 'light',
        completed: false
      }
    ],
    created_at: '2026-01-10T10:00:00Z',
    published_at: '2026-01-10T10:00:00Z'
  },
  {
    id: 102,
    isTemplate: true,
    assigned_count: 5,
    title: 'Athletic Performance - 8 Weeks',
    description: 'Advanced training for athletes. Explosive power, speed work, and mobility focus.',
    status: 'published',
    source_type: 'manual',
    duration_weeks: 8,
    current_week: 0,
    progress_percentage: 0,
    items: [
      {
        id: 'template-item-6',
        type: 'hydration',
        order: 1,
        title: 'Hydration + Electrolytes: 3.5L',
        completed: false
      },
      {
        id: 'template-item-7',
        type: 'mobility',
        order: 2,
        title: 'Dynamic warmup (15 mins)',
        instructions: 'Leg swings, arm circles, hip openers, movement prep',
        completed: false
      },
      {
        id: 'template-item-8',
        type: 'exercise',
        order: 3,
        title: 'Olympic lifts (Clean & Jerk)',
        instructions: 'Explosive triple extension, fast under the bar',
        sets: 5,
        reps: 3,
        rest_seconds: 180,
        intensity: 'intense',
        completed: false
      },
      {
        id: 'template-item-9',
        type: 'exercise',
        order: 4,
        title: 'Box jumps',
        instructions: 'Explosive takeoff, soft landing, step down',
        sets: 4,
        reps: 6,
        rest_seconds: 120,
        intensity: 'intense',
        completed: false
      },
      {
        id: 'template-item-10',
        type: 'mobility',
        order: 5,
        title: 'Cool-down mobility flow',
        instructions: '10 minutes active recovery, foam rolling, stretching',
        completed: false
      }
    ],
    created_at: '2025-12-01T10:00:00Z',
    published_at: '2025-12-01T10:00:00Z'
  },
  {
    id: 103,
    isTemplate: true,
    assigned_count: 0,
    title: 'Active Recovery Week',
    description: 'Light activity for deload weeks. Mobility, stretching, and low-intensity movement.',
    status: 'published',
    source_type: 'manual',
    duration_weeks: 1,
    current_week: 0,
    progress_percentage: 0,
    items: [
      {
        id: 'template-item-11',
        type: 'hydration',
        order: 1,
        title: 'Hydration: 2.5L minimum',
        completed: false
      },
      {
        id: 'template-item-12',
        type: 'mobility',
        order: 2,
        title: 'Full-body mobility flow (20 mins)',
        instructions: 'Focus on tight areas, gentle movements, breathwork',
        completed: false
      },
      {
        id: 'template-item-13',
        type: 'exercise',
        order: 3,
        title: 'Light walk or swim',
        instructions: '30 minutes low-intensity cardio for active recovery',
        sets: 1,
        reps: 30, // minutes
        intensity: 'light',
        completed: false
      },
      {
        id: 'template-item-14',
        type: 'mobility',
        order: 4,
        title: 'Evening stretching routine',
        instructions: '15 minutes static stretches, focus on relaxation',
        completed: false
      }
    ],
    created_at: '2026-02-15T10:00:00Z',
    published_at: '2026-02-15T10:00:00Z'
  }
];

// Mock Follow-ups
export const mockFollowUps: FollowUp[] = [
  {
    id: 1,
    client_id: 1,
    note: 'Check progress on protein intake',
    due_date: '2026-04-14',
    resolved: false,
    is_overdue: false
  },
  {
    id: 2,
    client_id: 1,
    note: 'Review form on squats video',
    due_date: '2026-04-18',
    resolved: false,
    is_overdue: false
  },
  {
    id: 3,
    client_id: 3,
    note: 'Send beginner nutrition guide',
    due_date: '2026-04-15',
    resolved: false,
    is_overdue: false
  },
  {
    id: 4,
    client_id: 4,
    note: 'Follow up on pause reason',
    due_date: '2026-04-10',
    resolved: false,
    is_overdue: true
  }
];

// Mock Upcoming Sessions
export const mockUpcomingSessions: UpcomingSession[] = [
  {
    id: 1,
    client_id: 1,
    date: '2026-04-14',
    time: '3:30 PM',
    location: 'Elite Fitness Gym',
    type: 'offline'
  },
  {
    id: 2,
    client_id: 1,
    date: '2026-04-17',
    time: '10:00 AM',
    location: 'Online via Zoom',
    type: 'online',
    zoom_link: 'https://zoom.us/j/123456789'
  },
  {
    id: 3,
    client_id: 1,
    date: '2026-04-21',
    time: '3:30 PM',
    location: 'Elite Fitness Gym',
    type: 'offline'
  },
  {
    id: 4,
    client_id: 2,
    date: '2026-04-15',
    time: '10:00 AM',
    location: 'Online via Zoom',
    type: 'online',
    zoom_link: 'https://zoom.us/j/987654321'
  },
  {
    id: 5,
    client_id: 3,
    date: '2026-04-16',
    time: '6:00 PM',
    location: 'PowerHouse Gym',
    type: 'offline'
  },
  {
    id: 6,
    client_id: 5,
    date: '2026-04-17',
    time: '12:00 PM',
    location: 'Online via Google Meet',
    type: 'online'
  }
];

// Mock Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  total_clients: 24,
  active_clients: 18,
  followups_due: 3,
  leads_pending: 5
};

// Helper functions
export function getClientById(id: number): Client | undefined {
  return mockClients.find(client => client.id === id);
}

export function getRoutinesByClientId(clientId: number): Routine[] {
  return mockRoutines.filter(routine => routine.client_id === clientId);
}

export function getActiveRoutineByClientId(clientId: number): Routine | undefined {
  return mockRoutines.find(
    routine => routine.client_id === clientId && routine.status === 'published'
  );
}

export function getFollowUpsByClientId(clientId: number): FollowUp[] {
  return mockFollowUps.filter(followup => followup.client_id === clientId);
}

export function getUpcomingSessionsByClientId(clientId: number): UpcomingSession[] {
  return mockUpcomingSessions.filter(session => session.client_id === clientId);
}
