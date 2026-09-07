type Table<Row, Insert = Partial<Row>> = { Row: Row; Insert: Insert; Update: Partial<Row>; Relationships: [] };
export type MessageRow = { id: string; studio_id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null };
export type CalendarEvent = { id: string; studio_id: string; teacher_id: string; student_id: string | null; title: string; description: string; location: string; starts_at: string; ends_at: string; time_zone: string; event_type: "lesson" | "studio_event" | "unavailable"; recurrence_group_id: string | null; created_at: string };
export type AvailabilityRule = { id: string; studio_id: string; teacher_id: string; weekday: number; start_minute: number; end_minute: number; time_zone: string; created_at: string };
export type BookingRequest = { id: string; studio_id: string; teacher_id: string; student_id: string; requested_start: string; requested_end: string; time_zone: string; note: string; status: "pending" | "approved" | "declined" | "cancelled"; response_note: string; calendar_event_id: string | null; created_at: string; responded_at: string | null };
export type Material = { id: string; studio_id: string; owner_id: string; name: string; storage_path: string | null; connection_id: string | null; provider_file_id: string | null; mime_type: string; size_bytes: number; shared: boolean; created_at: string };
export type CloudConnection = { id: string; profile_id: string; provider: string; encrypted_tokens: string; updated_at: string };
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: "teacher" | "student";
  created_at: string;
  avatar_path: string | null;
};

type StudioRow = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
};

type StudioMembershipRow = {
  id: string;
  studio_id: string;
  profile_id: string;
  role: "owner" | "teacher" | "student";
};

type StudentInviteRow = {
  id: string;
  studio_id: string;
  invited_email: string | null;
  invited_name: string;
  invite_code: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  created_by: string;
  accepted_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
};

type LessonNoteRow = {
  id: string;
  studio_id: string;
  student_id: string;
  teacher_id: string;
  lesson_date: string;
  repertoire: string;
  technique: string;
  teacher_notes: string;
  student_notes: string;
  action_items: string;
  created_at: string;
  updated_at: string;
};

type StudioHubPageRow = {
  id: string;
  studio_id: string;
  title: string;
  blocks: Json;
  is_published: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      messages: Table<MessageRow>;
      calendar_events: Table<CalendarEvent>;
      availability_rules: Table<AvailabilityRule>;
      booking_requests: Table<BookingRequest>;
      materials: Table<Material>;
      cloud_connections: Table<CloudConnection>;
      profiles: {
        Relationships: [];
        Row: ProfileRow;
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_path?: string | null;
          role?: "teacher" | "student";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_path?: string | null;
          role?: "teacher" | "student";
          created_at?: string;
        };
      };
      studios: {
        Relationships: [];
        Row: StudioRow;
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          invite_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          invite_code?: string;
          created_at?: string;
        };
      };
      studio_memberships: {
        Relationships: [];
        Row: StudioMembershipRow;
        Insert: {
          id?: string;
          studio_id: string;
          profile_id: string;
          role: "owner" | "teacher" | "student";
        };
        Update: {
          id?: string;
          studio_id?: string;
          profile_id?: string;
          role?: "owner" | "teacher" | "student";
        };
      };
      student_invites: {
        Relationships: [];
        Row: StudentInviteRow;
        Insert: {
          id?: string;
          studio_id: string;
          invited_email?: string | null;
          invited_name?: string;
          invite_code?: string;
          status?: "pending" | "accepted" | "revoked" | "expired";
          created_by: string;
          accepted_by?: string | null;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          studio_id?: string;
          invited_email?: string | null;
          invited_name?: string;
          invite_code?: string;
          status?: "pending" | "accepted" | "revoked" | "expired";
          created_by?: string;
          accepted_by?: string | null;
          created_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
        };
      };
      lesson_notes: {
        Relationships: [];
        Row: LessonNoteRow;
        Insert: {
          id?: string;
          studio_id: string;
          student_id: string;
          teacher_id: string;
          lesson_date?: string;
          repertoire?: string;
          technique?: string;
          teacher_notes?: string;
          student_notes?: string;
          action_items?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          studio_id?: string;
          student_id?: string;
          teacher_id?: string;
          lesson_date?: string;
          repertoire?: string;
          technique?: string;
          teacher_notes?: string;
          student_notes?: string;
          action_items?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      studio_hub_pages: {
        Relationships: [];
        Row: StudioHubPageRow;
        Insert: {
          id?: string;
          studio_id: string;
          title?: string;
          blocks?: Json;
          is_published?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          studio_id?: string;
          title?: string;
          blocks?: Json;
          is_published?: boolean;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      request_lesson_slot: { Args: { p_studio_id: string; p_teacher_id: string; p_requested_start: string; p_requested_end: string; p_time_zone: string; p_note?: string }; Returns: BookingRequest };
      respond_booking_request: { Args: { p_request_id: string; p_decision: "approved" | "declined"; p_response_note?: string }; Returns: BookingRequest };
      cancel_booking_request: { Args: { p_request_id: string }; Returns: BookingRequest };
      add_student_by_email: {
        Args: {
          p_studio_id: string;
          p_student_email: string;
        };
        Returns: StudioMembershipRow;
      };
      create_student_invite: {
        Args: {
          p_studio_id: string;
          p_invited_email: string | null;
          p_invited_name: string;
          p_expires_at?: string | null;
        };
        Returns: StudentInviteRow;
      };
      create_lesson_note: {
        Args: {
          p_studio_id: string;
          p_student_id: string;
          p_lesson_date: string;
          p_repertoire: string;
          p_technique: string;
          p_teacher_notes: string;
          p_student_notes: string;
          p_action_items: string;
        };
        Returns: LessonNoteRow;
      };
      create_studio_with_owner: {
        Args: {
          p_name: string;
        };
        Returns: StudioRow;
      };
      delete_lesson_note: {
        Args: {
          p_note_id: string;
        };
        Returns: undefined;
      };
      join_studio_by_invite: {
        Args: {
          p_invite_code: string;
        };
        Returns: StudioRow;
      };
      redeem_student_invite: {
        Args: {
          p_invite_code: string;
        };
        Returns: StudioRow;
      };
      remove_student_from_studio: {
        Args: {
          p_studio_id: string;
          p_profile_id: string;
        };
        Returns: undefined;
      };
      revoke_student_invite: {
        Args: {
          p_invite_id: string;
        };
        Returns: undefined;
      };
      update_lesson_note: {
        Args: {
          p_note_id: string;
          p_student_id: string;
          p_lesson_date: string;
          p_repertoire: string;
          p_technique: string;
          p_teacher_notes: string;
          p_student_notes: string;
          p_action_items: string;
        };
        Returns: LessonNoteRow;
      };
      update_lesson_note_student_notes: {
        Args: {
          p_note_id: string;
          p_student_notes: string;
        };
        Returns: LessonNoteRow;
      };
      upsert_studio_hub_page: {
        Args: {
          p_studio_id: string;
          p_title: string;
          p_blocks: Json;
          p_is_published: boolean;
        };
        Returns: StudioHubPageRow;
      };
    };
    Enums: {
      profile_role: "teacher" | "student";
      studio_membership_role: "owner" | "teacher" | "student";
      student_invite_status: "pending" | "accepted" | "revoked" | "expired";
    };
    CompositeTypes: Record<string, never>;
  };
};
