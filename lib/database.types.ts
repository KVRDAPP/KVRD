export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums / union types ────────────────────────────────────────────────────

export type CriminalizationStatus = 'legal' | 'illegal' | 'death_penalty';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type DestinationType = 'city' | 'country';
export type NotificationType =
  | 'score_change'
  | 'legal_update'
  | 'review_approved'
  | 'badge_earned';

// ─── Row types (what you get back from SELECT) ──────────────────────────────

export interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  identity_tags: string[] | null;
  travel_style: string[] | null;
  discreet_mode_enabled: boolean;
  notifications_enabled: boolean;
  created_at: string;
}

export interface DestinationRow {
  id: string;
  name: string;
  type: DestinationType;
  country_code: string;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  hero_image_url: string | null;
  sanity_content_id: string | null;
  created_at: string;
}

export interface SafetyScoreRow {
  id: string;
  destination_id: string;
  community_score: number;
  legal_score: number;
  composite_score: number;
  trans_score: number | null;
  womens_score: number | null;
  review_count: number;
  last_updated: string;
}

export interface LegalStatusRow {
  id: string;
  country_code: string;
  criminalization_status: CriminalizationStatus;
  same_sex_marriage: boolean;
  civil_unions: boolean;
  adoption_rights: boolean;
  anti_discrimination_protections: boolean;
  transgender_legal_recognition: boolean;
  ilga_tier: number | null;
  ilga_year: number | null;
  notes: string | null;
  last_updated: string;
}

export interface ReviewRow {
  id: string;
  user_id: string;
  destination_id: string;
  overall_score: number;
  identity_tags: string[] | null;
  body: string;
  visited_at: string | null;
  helpful_count: number;
  status: ReviewStatus;
  created_at: string;
}

export interface SavedDestinationRow {
  id: string;
  user_id: string;
  destination_id: string;
  created_at: string;
}

export interface VisitedDestinationRow {
  id: string;
  user_id: string;
  destination_id: string;
  visited_at: string | null;
  created_at: string;
}

export interface BadgeRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_url: string | null;
}

export interface BadgeGrantRow {
  id: string;
  user_id: string;
  badge_id: string;
  granted_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  destination_id: string | null;
  read: boolean;
  created_at: string;
}

// ─── Insert types (what you pass to INSERT) ─────────────────────────────────

export type UserInsert = Omit<UserRow, 'created_at'> &
  Partial<Pick<UserRow, 'created_at'>>;

export type DestinationInsert = Omit<DestinationRow, 'id' | 'created_at'> &
  Partial<Pick<DestinationRow, 'id' | 'created_at'>>;

export type SafetyScoreInsert = Omit<SafetyScoreRow, 'id' | 'last_updated'> &
  Partial<Pick<SafetyScoreRow, 'id' | 'last_updated'>>;

export type LegalStatusInsert = Omit<LegalStatusRow, 'id' | 'last_updated'> &
  Partial<Pick<LegalStatusRow, 'id' | 'last_updated'>>;

export type ReviewInsert = Omit<ReviewRow, 'id' | 'helpful_count' | 'status' | 'created_at'> &
  Partial<Pick<ReviewRow, 'id' | 'helpful_count' | 'status' | 'created_at'>>;

export type SavedDestinationInsert = Omit<SavedDestinationRow, 'id' | 'created_at'> &
  Partial<Pick<SavedDestinationRow, 'id' | 'created_at'>>;

export type VisitedDestinationInsert = Omit<VisitedDestinationRow, 'id' | 'created_at'> &
  Partial<Pick<VisitedDestinationRow, 'id' | 'created_at'>>;

export type BadgeInsert = Omit<BadgeRow, 'id'> & Partial<Pick<BadgeRow, 'id'>>;

export type BadgeGrantInsert = Omit<BadgeGrantRow, 'id' | 'granted_at'> &
  Partial<Pick<BadgeGrantRow, 'id' | 'granted_at'>>;

export type NotificationInsert = Omit<NotificationRow, 'id' | 'read' | 'created_at'> &
  Partial<Pick<NotificationRow, 'id' | 'read' | 'created_at'>>;

// ─── Update types (what you pass to UPDATE) ─────────────────────────────────

export type UserUpdate = Partial<
  Omit<UserRow, 'id' | 'created_at'>
>;

export type ReviewUpdate = Partial<
  Omit<ReviewRow, 'id' | 'user_id' | 'destination_id' | 'created_at'>
>;

export type SafetyScoreUpdate = Partial<
  Omit<SafetyScoreRow, 'id' | 'destination_id'>
>;

export type LegalStatusUpdate = Partial<
  Omit<LegalStatusRow, 'id' | 'country_code'>
>;

export type NotificationUpdate = Partial<Pick<NotificationRow, 'read'>>;

// ─── Supabase Database interface (used by createClient<Database>) ────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      destinations: {
        Row: DestinationRow;
        Insert: DestinationInsert;
        Update: Partial<Omit<DestinationRow, 'id' | 'created_at'>>;
      };
      safety_scores: {
        Row: SafetyScoreRow;
        Insert: SafetyScoreInsert;
        Update: SafetyScoreUpdate;
      };
      legal_statuses: {
        Row: LegalStatusRow;
        Insert: LegalStatusInsert;
        Update: LegalStatusUpdate;
      };
      reviews: {
        Row: ReviewRow;
        Insert: ReviewInsert;
        Update: ReviewUpdate;
      };
      saved_destinations: {
        Row: SavedDestinationRow;
        Insert: SavedDestinationInsert;
        Update: never;
      };
      visited_destinations: {
        Row: VisitedDestinationRow;
        Insert: VisitedDestinationInsert;
        Update: Partial<Pick<VisitedDestinationRow, 'visited_at'>>;
      };
      badges: {
        Row: BadgeRow;
        Insert: BadgeInsert;
        Update: Partial<Omit<BadgeRow, 'id' | 'slug'>>;
      };
      badge_grants: {
        Row: BadgeGrantRow;
        Insert: BadgeGrantInsert;
        Update: never;
      };
      notifications: {
        Row: NotificationRow;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      criminalization_status: CriminalizationStatus;
      review_status: ReviewStatus;
      destination_type: DestinationType;
      notification_type: NotificationType;
    };
  };
}
