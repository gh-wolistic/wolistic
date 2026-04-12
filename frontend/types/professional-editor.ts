export type ProfessionalApproachInput = {
  title: string;
  description: string;
};

export type ProfessionalAvailabilityInput = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
};

export type ProfessionalCertificationInput = {
  name: string;
  issuer: string;
  issued_year?: number;
};

export type ProfessionalExpertiseAreaInput = {
  title: string;
  description: string;
};

export type ProfessionalGalleryInput = {
  image_url: string;
  caption: string;
  display_order: number;
};

export type ProfessionalServiceInput = {
  name: string;
  short_brief: string;
  price: number;
  offers: string;
  negotiable: boolean;
  offer_type: string;
  offer_value?: number;
  offer_label: string;
  offer_starts_at?: string;
  offer_ends_at?: string;
  mode: string;
  duration_value: number;
  duration_unit: string;
  max_participants?: number | null;
  is_active: boolean;
};

export type QuestionType = "text" | "scale" | "choice";

export type BookingQuestionTemplateInput = {
  prompt: string;
  question_type: QuestionType;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
};

export type ProfessionalServiceAreaInput = {
  city_name: string;
  latitude?: number;
  longitude?: number;
  radius_km: number;
  is_primary: boolean;
};

export type SocialLinksInput = {
  website?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  twitter?: string;
  tiktok?: string;
};

export type ProfessionalEditorPayload = {
  professional_id: string;
  username: string;
  cover_image_url: string;
  profile_image_url: string;
  specialization: string;
  membership_tier: string;
  experience_years: number;
  location: string;
  sex: string;
  short_bio: string;
  about: string;
  // Extended fields
  pronouns: string;
  who_i_work_with: string;
  client_goals: string[];
  response_time_hours: number;
  cancellation_hours: number;
  social_links: SocialLinksInput;
  video_intro_url: string;
  default_timezone: string;
  approaches: ProfessionalApproachInput[];
  availability_slots: ProfessionalAvailabilityInput[];
  certifications: ProfessionalCertificationInput[];
  education: string[];
  expertise_areas: ProfessionalExpertiseAreaInput[];
  gallery: ProfessionalGalleryInput[];
  languages: string[];
  session_types: string[];
  subcategories: string[];
  services: ProfessionalServiceInput[];
  service_areas: ProfessionalServiceAreaInput[];
  booking_question_templates: BookingQuestionTemplateInput[];
};

export type ProfessionalEditorUpdatePayload = Omit<ProfessionalEditorPayload, "professional_id"> & {
  service_areas: ProfessionalServiceAreaInput[];
};
