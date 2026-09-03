-- Additive migration. Existing studios, lessons and profiles are preserved.
alter table public.profiles add column if not exists avatar_path text;
revoke insert, update, delete on public.profiles from authenticated;
grant update (avatar_path) on public.profiles to authenticated;
create policy "Update own avatar" on public.profiles for update to authenticated
using (id=auth.uid()) with check (id=auth.uid() and (avatar_path is null or avatar_path like auth.uid()::text || '/%'));

create or replace function public.can_message(s uuid, a uuid, b uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select a <> b and exists (
 select 1 from studio_memberships x join studio_memberships y on x.studio_id=y.studio_id
 where x.studio_id=s and x.profile_id=a and y.profile_id=b
 and ((x.role in ('owner','teacher') and y.role='student') or (y.role in ('owner','teacher') and x.role='student')))
$$;
create table public.messages (
 id uuid primary key default gen_random_uuid(), studio_id uuid not null references public.studios on delete cascade,
 sender_id uuid not null references public.profiles on delete cascade,
 recipient_id uuid not null references public.profiles on delete cascade,
 body text not null check (length(trim(body)) between 1 and 4000),
 created_at timestamptz not null default now(), read_at timestamptz
);
create index on public.messages(studio_id, recipient_id, created_at);
create index on public.messages(studio_id, sender_id, created_at);
alter table public.messages enable row level security;
create policy "Conversation participants read" on public.messages for select to authenticated
using (auth.uid() in (sender_id,recipient_id) and public.can_message(studio_id,sender_id,recipient_id));
create policy "Send to studio counterpart" on public.messages for insert to authenticated
with check (sender_id=auth.uid() and read_at is null and public.can_message(studio_id,sender_id,recipient_id));
create policy "Recipient reads message" on public.messages for update to authenticated
using (recipient_id=auth.uid() and public.can_message(studio_id,sender_id,recipient_id)) with check (recipient_id=auth.uid());
revoke all on public.messages from anon, authenticated;
grant select on public.messages to authenticated;
grant insert (studio_id,sender_id,recipient_id,body) on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;

create table public.calendar_events (
 id uuid primary key default gen_random_uuid(), studio_id uuid not null references public.studios on delete cascade,
 teacher_id uuid not null references public.profiles on delete cascade,
 student_id uuid references public.profiles on delete cascade,
 title text not null check(length(trim(title)) between 1 and 120),
 description text not null default '' check(length(description)<=4000),
 location text not null default '' check(length(location)<=300),
 starts_at timestamptz not null, ends_at timestamptz not null,
 time_zone text not null default 'UTC', created_at timestamptz not null default now(),
 check(ends_at>starts_at and ends_at<=starts_at+interval '7 days')
);
create index on public.calendar_events(studio_id,starts_at);
alter table public.calendar_events enable row level security;
create policy "View relevant events" on public.calendar_events for select to authenticated using (
 public.is_studio_teacher(studio_id) or (public.is_studio_member(studio_id) and (student_id is null or student_id=auth.uid())));
create policy "Teachers create events" on public.calendar_events for insert to authenticated with check (
 teacher_id=auth.uid() and public.is_studio_teacher(studio_id));
create policy "Teachers update own events" on public.calendar_events for update to authenticated
using (teacher_id=auth.uid() and public.is_studio_teacher(studio_id)) with check (teacher_id=auth.uid() and public.is_studio_teacher(studio_id));
create policy "Teachers delete own events" on public.calendar_events for delete to authenticated using (teacher_id=auth.uid() and public.is_studio_teacher(studio_id));
grant select, insert, update, delete on public.calendar_events to authenticated;
create or replace function public.validate_calendar_event() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.student_id is not null and not public.is_studio_student(new.studio_id,new.student_id) then raise exception 'Choose an active student in this studio'; end if;
 if not exists(select 1 from pg_timezone_names where name=new.time_zone) then raise exception 'Invalid time zone'; end if;
 perform pg_advisory_xact_lock(hashtext(new.studio_id::text));
 if exists(select 1 from public.calendar_events e where e.studio_id=new.studio_id and e.id<>new.id
 and e.starts_at<new.ends_at and e.ends_at>new.starts_at
 and (e.teacher_id=new.teacher_id or e.student_id is null or new.student_id is null or e.student_id=new.student_id)) then
 raise exception 'This time overlaps another lesson or studio event'; end if;
 return new;
end $$;
create trigger validate_calendar_event before insert or update on public.calendar_events for each row execute function public.validate_calendar_event();

create table public.cloud_connections (
 id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles on delete cascade,
 provider text not null check(provider in ('google','onedrive','dropbox')),
 encrypted_tokens text not null, updated_at timestamptz not null default now(), unique(profile_id,provider)
);
alter table public.cloud_connections enable row level security;
create policy "Own cloud accounts" on public.cloud_connections for all to authenticated using(profile_id=auth.uid()) with check(profile_id=auth.uid());
grant select,insert,update,delete on public.cloud_connections to authenticated;
create or replace function public.profile_in_studio(s uuid, p uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from studio_memberships where studio_id=s and profile_id=p)
$$;
create table public.materials (
 id uuid primary key default gen_random_uuid(), studio_id uuid not null references public.studios on delete cascade,
 owner_id uuid not null references public.profiles on delete cascade,
 name text not null check(length(name) between 1 and 255),
 storage_path text, connection_id uuid references public.cloud_connections on delete cascade,
 provider_file_id text, mime_type text not null default 'application/octet-stream',
 size_bytes bigint not null default 0 check(size_bytes>=0),
 shared boolean not null default false, created_at timestamptz not null default now(),
 check ((storage_path is not null and connection_id is null and provider_file_id is null) or (storage_path is null and connection_id is not null and provider_file_id is not null))
);
create index on public.materials(studio_id,created_at);
alter table public.materials enable row level security;
create policy "Read own or shared materials" on public.materials for select to authenticated
using(public.is_studio_member(studio_id) and (owner_id=auth.uid() or (shared and public.profile_in_studio(studio_id,owner_id))));
create policy "Members add own materials" on public.materials for insert to authenticated
with check(owner_id=auth.uid() and public.is_studio_member(studio_id)
 and (storage_path is null or storage_path like auth.uid()::text || '/%')
 and (connection_id is null or exists(select 1 from public.cloud_connections c where c.id=connection_id and c.profile_id=auth.uid())));
create policy "Owners change material sharing" on public.materials for update to authenticated using(owner_id=auth.uid() and public.is_studio_member(studio_id)) with check(owner_id=auth.uid());
create policy "Owners remove materials" on public.materials for delete to authenticated using(owner_id=auth.uid() and public.is_studio_member(studio_id));
revoke all on public.materials from anon, authenticated;
grant select,insert,delete on public.materials to authenticated;
grant update (shared) on public.materials to authenticated;
