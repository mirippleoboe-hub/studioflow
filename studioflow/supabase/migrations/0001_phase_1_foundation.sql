create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_role') then
    create type public.profile_role as enum ('teacher', 'student');
  end if;

  if not exists (select 1 from pg_type where typname = 'studio_membership_role') then
    create type public.studio_membership_role as enum ('owner', 'teacher', 'student');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.profile_role not null default 'student',
  created_at timestamptz not null default now()
);

create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_at timestamptz not null default now()
);

create table if not exists public.studio_memberships (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.studio_membership_role not null,
  unique (studio_id, profile_id)
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists studios_owner_id_idx on public.studios(owner_id);
create index if not exists studios_invite_code_idx on public.studios(invite_code);
create index if not exists studio_memberships_profile_id_idx on public.studio_memberships(profile_id);
create index if not exists studio_memberships_studio_id_idx on public.studio_memberships(studio_id);

create or replace function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_studio_member(target_studio_id uuid)
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
  )
$$;

create or replace function public.is_studio_owner(target_studio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.studios
    where id = target_studio_id
      and owner_id = auth.uid()
  )
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role public.profile_role;
begin
  selected_role := case
    when new.raw_user_meta_data ->> 'role' = 'teacher' then 'teacher'::public.profile_role
    else 'student'::public.profile_role
  end;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    selected_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.create_studio_with_owner(p_name text)
returns public.studios
language plpgsql
security definer
set search_path = public
as $$
declare
  new_studio public.studios;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_profile_role() <> 'teacher'::public.profile_role then
    raise exception 'Only teacher accounts can create studios';
  end if;

  insert into public.studios (name, owner_id)
  values (nullif(trim(p_name), ''), auth.uid())
  returning * into new_studio;

  insert into public.studio_memberships (studio_id, profile_id, role)
  values (new_studio.id, auth.uid(), 'owner'::public.studio_membership_role)
  on conflict (studio_id, profile_id) do nothing;

  return new_studio;
end;
$$;

create or replace function public.join_studio_by_invite(p_invite_code text)
returns public.studios
language plpgsql
security definer
set search_path = public
as $$
declare
  target_studio public.studios;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_profile_role() <> 'student'::public.profile_role then
    raise exception 'Only student accounts can join with an invite code';
  end if;

  select *
  into target_studio
  from public.studios
  where invite_code = upper(trim(p_invite_code))
  limit 1;

  if target_studio.id is null then
    raise exception 'Invalid studio invite code';
  end if;

  insert into public.studio_memberships (studio_id, profile_id, role)
  values (target_studio.id, auth.uid(), 'student'::public.studio_membership_role)
  on conflict (studio_id, profile_id) do nothing;

  return target_studio;
end;
$$;

alter table public.profiles enable row level security;
alter table public.studios enable row level security;
alter table public.studio_memberships enable row level security;

drop policy if exists "Profiles can be read by self and studio peers" on public.profiles;
create policy "Profiles can be read by self and studio peers"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.studio_memberships requester
    join public.studio_memberships target
      on target.studio_id = requester.studio_id
    where requester.profile_id = auth.uid()
      and target.profile_id = profiles.id
  )
);

drop policy if exists "Studios can be read by members" on public.studios;
create policy "Studios can be read by members"
on public.studios
for select
to authenticated
using (owner_id = auth.uid() or public.is_studio_member(id));

drop policy if exists "Teachers can insert owned studios" on public.studios;
create policy "Teachers can insert owned studios"
on public.studios
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and public.current_profile_role() = 'teacher'::public.profile_role
);

drop policy if exists "Studio owners can update studios" on public.studios;
create policy "Studio owners can update studios"
on public.studios
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Studio owners can delete studios" on public.studios;
create policy "Studio owners can delete studios"
on public.studios
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Memberships can be read by studio members" on public.studio_memberships;
create policy "Memberships can be read by studio members"
on public.studio_memberships
for select
to authenticated
using (public.is_studio_member(studio_id));

drop policy if exists "Owners can insert memberships" on public.studio_memberships;
create policy "Owners can insert memberships"
on public.studio_memberships
for insert
to authenticated
with check (
  public.is_studio_owner(studio_id)
  and (
    (profile_id = auth.uid() and role = 'owner'::public.studio_membership_role)
    or role in ('teacher'::public.studio_membership_role, 'student'::public.studio_membership_role)
  )
);

drop policy if exists "Owners can update memberships" on public.studio_memberships;
create policy "Owners can update memberships"
on public.studio_memberships
for update
to authenticated
using (public.is_studio_owner(studio_id))
with check (public.is_studio_owner(studio_id));

drop policy if exists "Owners can delete memberships" on public.studio_memberships;
create policy "Owners can delete memberships"
on public.studio_memberships
for delete
to authenticated
using (public.is_studio_owner(studio_id));

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.studios, public.studio_memberships to authenticated;
grant insert, update, delete on public.studios, public.studio_memberships to authenticated;
grant execute on function public.create_studio_with_owner(text) to authenticated;
grant execute on function public.join_studio_by_invite(text) to authenticated;
