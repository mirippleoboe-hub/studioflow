export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: "teacher" | "student";
  created_at: string;
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
      profiles: {
        Relationships: [];
        Row: ProfileRow;
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          role?: "teacher" | "student";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
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
