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
  is_active: boolean;
};

export type BookingQuestionTemplateInput = {
  prompt: string;
  display_order: number;
  is_required: boolean;
  is_active: boolean;
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
  booking_question_templates: BookingQuestionTemplateInput[];
};

export type ProfessionalEditorUpdatePayload = Omit<ProfessionalEditorPayload, "professional_id">;
