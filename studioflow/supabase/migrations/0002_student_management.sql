do $$
begin
  if not exists (select 1 from pg_type where typname = 'student_invite_status') then
    create type public.student_invite_status as enum ('pending', 'accepted', 'revoked', 'expired');
  end if;
end $$;

create table if not exists public.student_invites (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  invited_email text,
  invited_name text not null default '',
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  status public.student_invite_status not null default 'pending',
  created_by uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  accepted_at timestamptz,
  revoked_at timestamptz
);

create index if not exists student_invites_studio_id_idx on public.student_invites(studio_id);
create index if not exists student_invites_status_idx on public.student_invites(status);
create index if not exists student_invites_invite_code_idx on public.student_invites(invite_code);
create unique index if not exists student_invites_pending_email_idx
  on public.student_invites (studio_id, lower(invited_email))
  where status = 'pending'::public.student_invite_status and invited_email is not null;

create or replace function public.is_studio_teacher(target_studio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.studio_memberships
    where studio_id = target_studio_id
      and profile_id = auth.uid()
      and role in ('owner'::public.studio_membership_role, 'teacher'::public.studio_membership_role)
  )
$$;

create or replace function public.create_student_invite(
  p_studio_id uuid,
  p_invited_email text,
  p_invited_name text,
  p_expires_at timestamptz default null
)
returns public.student_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  new_invite public.student_invites;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_studio_teacher(p_studio_id) then
    raise exception 'Only studio teachers can invite students';
  end if;

  insert into public.student_invites (
    studio_id,
    invited_email,
    invited_name,
    created_by,
    expires_at
  )
  values (
    p_studio_id,
    nullif(lower(trim(p_invited_email)), ''),
    coalesce(nullif(trim(p_invited_name), ''), 'Student'),
    auth.uid(),
    coalesce(p_expires_at, now() + interval '30 days')
  )
  returning * into new_invite;

  return new_invite;
end;
$$;

create or replace function public.add_student_by_email(
  p_studio_id uuid,
  p_student_email text
)
returns public.studio_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  target_profile public.profiles;
  new_membership public.studio_memberships;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_studio_teacher(p_studio_id) then
    raise exception 'Only studio teachers can add students';
  end if;

  select *
  into target_profile
  from public.profiles
  where lower(email) = lower(trim(p_student_email))
    and role = 'student'::public.profile_role
  limit 1;

  if target_profile.id is null then
    raise exception 'No student account found for that email';
  end if;

  insert into public.studio_memberships (studio_id, profile_id, role)
  values (p_studio_id, target_profile.id, 'student'::public.studio_membership_role)
  on conflict (studio_id, profile_id) do update
  set role = excluded.role
  returning * into new_membership;

  update public.student_invites
  set
    status = 'accepted'::public.student_invite_status,
    accepted_by = target_profile.id,
    accepted_at = now()
  where studio_id = p_studio_id
    and invited_email = lower(trim(p_student_email))
    and status = 'pending'::public.student_invite_status;

  return new_membership;
end;
$$;

create or replace function public.remove_student_from_studio(
  p_studio_id uuid,
  p_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_studio_teacher(p_studio_id) then
    raise exception 'Only studio teachers can remove students';
  end if;

  delete from public.studio_memberships
  where studio_id = p_studio_id
    and profile_id = p_profile_id
    and role = 'student'::public.studio_membership_role;
end;
$$;

create or replace function public.revoke_student_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite public.student_invites;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_invite
  from public.student_invites
  where id = p_invite_id
  limit 1;

  if target_invite.id is null then
    raise exception 'Invite not found';
  end if;

  if not public.is_studio_teacher(target_invite.studio_id) then
    raise exception 'Only studio teachers can revoke invites';
  end if;

  update public.student_invites
  set
    status = 'revoked'::public.student_invite_status,
    revoked_at = now()
  where id = p_invite_id
    and status = 'pending'::public.student_invite_status;
end;
$$;

create or replace function public.redeem_student_invite(p_invite_code text)
returns public.studios
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite public.student_invites;
  current_profile public.profiles;
  target_studio public.studios;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = auth.uid()
  limit 1;

  if current_profile.id is null or current_profile.role <> 'student'::public.profile_role then
    raise exception 'Only student accounts can redeem student invites';
  end if;

  select *
  into target_invite
  from public.student_invites
  where invite_code = upper(trim(p_invite_code))
    and status = 'pending'::public.student_invite_status
  limit 1;

  if target_invite.id is null then
    raise exception 'Invalid or expired student invite';
  end if;

  if target_invite.expires_at < now() then
    update public.student_invites
    set status = 'expired'::public.student_invite_status
    where id = target_invite.id;

    raise exception 'Invalid or expired student invite';
  end if;

  if target_invite.invited_email is not null and target_invite.invited_email <> lower(current_profile.email) then
    raise exception 'This invite is assigned to a different email address';
  end if;

  insert into public.studio_memberships (studio_id, profile_id, role)
  values (target_invite.studio_id, auth.uid(), 'student'::public.studio_membership_role)
  on conflict (studio_id, profile_id) do update
  set role = excluded.role;

  update public.student_invites
  set
    status = 'accepted'::public.student_invite_status,
    accepted_by = auth.uid(),
    accepted_at = now()
  where id = target_invite.id;

  select *
  into target_studio
  from public.studios
  where id = target_invite.studio_id;

  return target_studio;
end;
$$;

alter table public.student_invites enable row level security;

drop policy if exists "Teachers can read studio student invites" on public.student_invites;
create policy "Teachers can read studio student invites"
on public.student_invites
for select
to authenticated
using (public.is_studio_teacher(studio_id));

drop policy if exists "Students can read their accepted invites" on public.student_invites;
create policy "Students can read their accepted invites"
on public.student_invites
for select
to authenticated
using (accepted_by = auth.uid());

grant select on public.student_invites to authenticated;
grant execute on function public.create_student_invite(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.add_student_by_email(uuid, text) to authenticated;
grant execute on function public.remove_student_from_studio(uuid, uuid) to authenticated;
grant execute on function public.revoke_student_invite(uuid) to authenticated;
grant execute on function public.redeem_student_invite(text) to authenticated;
