export type UserRole = "teacher" | "student";

export type StudioMembershipRole = "owner" | "teacher" | "student";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
};

export type Studio = {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
};

export type StudioMembership = {
  id: string;
  studio_id: string;
  profile_id: string;
  role: StudioMembershipRole;
};
