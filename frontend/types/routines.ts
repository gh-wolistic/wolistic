// TypeScript types for Client Manager v2 - Routines System

export type AcquisitionSource = 
  | 'expert_invite' 
  | 'organic_search' 
  | 'corporate_event' 
  | 'wolistic_recommendation' 
  | 'wolistic_lead';

export type ClientStatus = 'active' | 'paused' | 'archived';

export type RoutineStatus = 'draft' | 'under_review' | 'approved' | 'published' | 'archived';

// Body Expert specific item types (no meal/meditation - holistic handled separately)
export type RoutineItemType = 'exercise' | 'hydration' | 'mobility';

export interface SourceMetadata {
  invitation_sent_at?: string;
  invitation_accepted_at?: string;
  search_query?: string;
  referrer_url?: string;
  event_name?: string;
  employee_id?: string;
  recommended_experts?: string[];
  recommendation_reason?: string;
  lead_source?: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  initials: string;
  status: ClientStatus;
  acquisition_source: AcquisitionSource;
  source_metadata?: SourceMetadata;
  enrolled_date: string;
  
  // Session tracking
  total_sessions: number;
  completed_sessions: number;
  next_session?: {
    date: string;
    time: string;
    location: string;
    type: 'online' | 'offline';
  };
  
  // Engagement metrics
  attendance_count: number;
  attendance_total: number;
  current_streak_weeks: number;
  lifetime_value: number;
  
  // Profile details
  goals?: string;
  preferences?: string;
  medical_history?: string;
  dietary_requirements?: string;
  
  // Physical metrics (for invited clients, body expert specific)
  client_details?: {
    age?: number;
    height_cm?: number;
    weight_kg?: number;
    bmi?: number; // Auto-calculated
    goals?: string;
  };
  
  // Follow-ups
  pending_followups: number;
}

export interface RoutineItem {
  id: string;
  type: RoutineItemType;
  order: number;
  
  // Common fields
  title: string;
  instructions?: string;
  
  // Exercise-specific
  sets?: number;
  reps?: number;
  rest_seconds?: number;
  intensity?: 'light' | 'moderate' | 'intense';
  
  // Meal-specific
  meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories?: number;
  
  // Check-in tracking
  completed: boolean;
  completed_at?: string;
}

export interface Routine {
  id: number;
  client_id?: number; // Optional for templates
  title: string;
  description: string;
  status: RoutineStatus;
  source_type: 'manual' | 'ai_generated';
  
  // Template support
  isTemplate?: boolean; // True if this is a template routine
  template_id?: number; // If assigned from template, tracks source template
  assigned_count?: number; // For templates: how many clients have this assigned
  
  // Timeline
  duration_weeks: number;
  current_week: number;
  progress_percentage: number;
  
  // Items
  items: RoutineItem[];
  
  // Timestamps
  created_at: string;
  published_at?: string;
  approved_at?: string;
}

export interface FollowUp {
  id: number;
  client_id: number;
  note: string;
  due_date: string;
  resolved: boolean;
  is_overdue: boolean;
}

export interface UpcomingSession {
  id: number;
  client_id: number;
  date: string;
  time: string;
  location: string;
  type: 'online' | 'offline';
  zoom_link?: string;
}

export interface DashboardMetrics {
  total_clients: number;
  active_clients: number;
  followups_due: number;
  leads_pending: number;
}
