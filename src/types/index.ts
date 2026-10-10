// ==================== DONOR Platform Types ====================

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type DonorStatus = 'available' | 'busy' | 'unavailable';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type RequestStatus =
  | 'new'
  | 'searching'
  | 'donor_responded'
  | 'agreed'
  | 'completed'
  | 'cancelled';

export type NotificationType =
  | 'blood_request'
  | 'donor_response'
  | 'new_message'
  | 'request_status_changed'
  | 'medication_reminder'
  | 'admin_review';

export type UserTrack = 'medication' | 'donor' | 'recipient';

// ==================== User / Profile ====================

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  blood_group?: BloodGroup;
  region?: string;
  avatar_url?: string;
  donor_status: DonorStatus;
  is_donor: boolean;
  is_admin: boolean;
  is_blocked: boolean;
  user_track?: UserTrack;
  donations_count: number;
  helped_count: number;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

// ==================== Blood Request ====================

export interface BloodRequest {
  id: string;
  requester_id: string;
  requester?: Profile;
  blood_group: BloodGroup;
  quantity_units: number;
  region: string;
  hospital?: string;
  urgency: UrgencyLevel;
  needed_by?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  status: RequestStatus;
  matched_donors?: number;
  created_at: string;
  updated_at?: string;
}

// ==================== Request Response ====================

export interface RequestResponse {
  id: string;
  request_id: string;
  donor_id: string;
  donor?: Profile;
  response: 'accepted' | 'declined';
  message?: string;
  created_at: string;
}

// ==================== Notification ====================

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ==================== Chat / Messages ====================

export interface Conversation {
  id: string;
  request_id: string;
  donor_id: string;
  requester_id: string;
  donor?: Profile;
  requester?: Profile;
  is_blocked: boolean;
  created_at: string;
  updated_at?: string;
  last_message?: string | Message;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: Profile;
  content: string;
  is_read: boolean;
  created_at: string;
}

// ==================== Medication Reminder ====================

export type RepeatInterval = 'daily' | 'weekly' | 'custom';

export interface MedicationReminder {
  id: string;
  user_id: string;
  medication_name: string;
  start_time: string; // HH:mm
  repeat_count: number;
  repeat_interval_minutes: number;
  days_of_week: number[]; // 0=Sunday, 1=Monday...
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationLog {
  id: string;
  reminder_id: string;
  taken_at: string;
  status: 'taken' | 'skipped' | 'snoozed';
  created_at: string;
}

// ==================== Report ====================

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id?: string;
  conversation_id?: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

// ==================== Admin ====================

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: Record<string, unknown>;
  created_at: string;
}

// ==================== AI Agent ====================

export type AIIntent =
  | 'need_blood'
  | 'want_to_donate'
  | 'find_nearest_donor'
  | 'find_clinic'
  | 'medication_reminder'
  | 'health_issue'
  | 'general_question'
  | 'unknown';

export interface AIMessage {
  id: string;
  role?: 'user' | 'assistant';
  sender?: 'user' | 'ai';
  content?: string;
  text?: string;
  intent?: AIIntent;
  actions?: AIAction[];
  timestamp: string;
}

export interface AIAction {
  label: string;
  action: string;
  data?: Record<string, unknown>;
}

// ==================== Demo Data Types ====================

export interface DemoMarker {
  id: string;
  name: string;
  blood_group: BloodGroup;
  status: DonorStatus;
  region: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

// ==================== Stats ====================

export interface PlatformStats {
  total_donors: number;
  active_donors: number;
  completed_helps: number;
  active_requests: number;
}
