-- Assignments and studio announcements. Existing data is preserved.
create table public.assignments (
 id uuid primary key default gen_random_uuid(),
 studio_id uuid not null references public.studios on delete cascade,
 teacher_id uuid not null references public.profiles on delete cascade,
 student_id uuid references public.profiles on delete cascade,
 title text not null check(length(trim(title)) between 1 and 120),
 instructions text not null default '' check(length(instructions)<=6000),
 due_date date,
 status text not null default 'active' check(status in ('active','archived')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index on public.assignments(studio_id,status,due_date);
alter table public.assignments enable row level security;
create policy "View relevant assignments" on public.assignments for select to authenticated using(
 public.is_studio_teacher(studio_id) or (public.is_studio_member(studio_id) and (student_id is null or student_id=auth.uid()))
);
create policy "Teachers create assignments" on public.assignments for insert to authenticated with check(
 teacher_id=auth.uid() and public.is_studio_teacher(studio_id)
);
create policy "Teachers update own assignments" on public.assignments for update to authenticated
 using(teacher_id=auth.uid() and public.is_studio_teacher(studio_id))
 with check(teacher_id=auth.uid() and public.is_studio_teacher(studio_id));
create policy "Teachers delete own assignments" on public.assignments for delete to authenticated
 using(teacher_id=auth.uid() and public.is_studio_teacher(studio_id));
grant select,insert,update,delete on public.assignments to authenticated;

create or replace function public.validate_assignment() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.student_id is not null and not public.is_studio_student(new.studio_id,new.student_id) then raise exception 'Choose an active student in this studio'; end if;
 new.updated_at=now(); return new;
end $$;
create trigger validate_assignment before insert or update on public.assignments for each row execute function public.validate_assignment();

create table public.announcements (
 id uuid primary key default gen_random_uuid(),
 studio_id uuid not null references public.studios on delete cascade,
 author_id uuid not null references public.profiles on delete cascade,
 title text not null check(length(trim(title)) between 1 and 120),
 body text not null check(length(trim(body)) between 1 and 4000),
 published_at timestamptz not null default now(),
 expires_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(expires_at is null or expires_at>published_at)
);
create index on public.announcements(studio_id,published_at desc);
alter table public.announcements enable row level security;
create policy "Studio members see announcements" on public.announcements for select to authenticated
 using(public.is_studio_member(studio_id));
create policy "Teachers create announcements" on public.announcements for insert to authenticated
 with check(author_id=auth.uid() and public.is_studio_teacher(studio_id));
create policy "Teachers update own announcements" on public.announcements for update to authenticated
 using(author_id=auth.uid() and public.is_studio_teacher(studio_id))
 with check(author_id=auth.uid() and public.is_studio_teacher(studio_id));
create policy "Teachers delete own announcements" on public.announcements for delete to authenticated
 using(author_id=auth.uid() and public.is_studio_teacher(studio_id));
grant select,insert,update,delete on public.announcements to authenticated;

create or replace function public.touch_announcement() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
create trigger touch_announcement before update on public.announcements for each row execute function public.touch_announcement();
