create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  lesson_date date not null default current_date,
  repertoire text not null default '',
  technique text not null default '',
  teacher_notes text not null default '',
  student_notes text not null default '',
  action_items text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_notes_studio_id_idx on public.lesson_notes(studio_id);
create index if not exists lesson_notes_student_id_idx on public.lesson_notes(student_id);
create index if not exists lesson_notes_teacher_id_idx on public.lesson_notes(teacher_id);
create index if not exists lesson_notes_lesson_date_idx on public.lesson_notes(lesson_date desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_lesson_notes_updated_at on public.lesson_notes;
create trigger set_lesson_notes_updated_at
  before update on public.lesson_notes
  for each row execute function public.set_updated_at();

create or replace function public.is_studio_student(target_studio_id uuid, target_profile_id uuid)
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
      and profile_id = target_profile_id
      and role = 'student'::public.studio_membership_role
  )
$$;

create or replace function public.create_lesson_note(
  p_studio_id uuid,
  p_student_id uuid,
  p_lesson_date date,
  p_repertoire text,
  p_technique text,
  p_teacher_notes text,
  p_student_notes text,
  p_action_items text
)
returns public.lesson_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  new_note public.lesson_notes;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_studio_teacher(p_studio_id) then
    raise exception 'Only studio teachers can create lesson notes';
  end if;

  if not public.is_studio_student(p_studio_id, p_student_id) then
    raise exception 'Lesson notes can only be created for active students in this studio';
  end if;

  insert into public.lesson_notes (
    studio_id,
    student_id,
    teacher_id,
    lesson_date,
    repertoire,
    technique,
    teacher_notes,
    student_notes,
    action_items
  )
  values (
    p_studio_id,
    p_student_id,
    auth.uid(),
    coalesce(p_lesson_date, current_date),
    coalesce(p_repertoire, ''),
    coalesce(p_technique, ''),
    coalesce(p_teacher_notes, ''),
    coalesce(p_student_notes, ''),
    coalesce(p_action_items, '')
  )
  returning * into new_note;

  return new_note;
end;
$$;

create or replace function public.update_lesson_note(
  p_note_id uuid,
  p_student_id uuid,
  p_lesson_date date,
  p_repertoire text,
  p_technique text,
  p_teacher_notes text,
  p_student_notes text,
  p_action_items text
)
returns public.lesson_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  target_note public.lesson_notes;
  updated_note public.lesson_notes;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_note
  from public.lesson_notes
  where id = p_note_id
  limit 1;

  if target_note.id is null then
    raise exception 'Lesson note not found';
  end if;

  if not public.is_studio_teacher(target_note.studio_id) then
    raise exception 'Only studio teachers can update lesson notes';
  end if;

  if p_student_id <> target_note.student_id and not public.is_studio_student(target_note.studio_id, p_student_id) then
    raise exception 'Lesson notes can only be assigned to active students in this studio';
  end if;

  update public.lesson_notes
  set
    student_id = p_student_id,
    lesson_date = coalesce(p_lesson_date, current_date),
    repertoire = coalesce(p_repertoire, ''),
    technique = coalesce(p_technique, ''),
    teacher_notes = coalesce(p_teacher_notes, ''),
    student_notes = coalesce(p_student_notes, ''),
    action_items = coalesce(p_action_items, '')
  where id = p_note_id
  returning * into updated_note;

  return updated_note;
end;
$$;

create or replace function public.update_lesson_note_student_notes(
  p_note_id uuid,
  p_student_notes text
)
returns public.lesson_notes
language plpgsql
security definer
set search_path = public
as $$
declare
  target_note public.lesson_notes;
  updated_note public.lesson_notes;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_note
  from public.lesson_notes
  where id = p_note_id
  limit 1;

  if target_note.id is null then
    raise exception 'Lesson note not found';
  end if;

  if target_note.student_id <> auth.uid() or not public.is_studio_student(target_note.studio_id, auth.uid()) then
    raise exception 'Students can only update notes for their own active studio lessons';
  end if;

  update public.lesson_notes
  set student_notes = coalesce(p_student_notes, '')
  where id = p_note_id
  returning * into updated_note;

  return updated_note;
end;
$$;

create or replace function public.delete_lesson_note(p_note_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_note public.lesson_notes;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_note
  from public.lesson_notes
  where id = p_note_id
  limit 1;

  if target_note.id is null then
    raise exception 'Lesson note not found';
  end if;

  if not public.is_studio_teacher(target_note.studio_id) then
    raise exception 'Only studio teachers can delete lesson notes';
  end if;

  delete from public.lesson_notes
  where id = p_note_id;
end;
$$;

alter table public.lesson_notes enable row level security;

drop policy if exists "Lesson notes are readable by studio teachers and assigned students" on public.lesson_notes;
drop policy if exists "Lesson notes are readable by studio teachers and assigned active students" on public.lesson_notes;
create policy "Lesson notes are readable by studio teachers and assigned active students"
on public.lesson_notes
for select
to authenticated
using (
  public.is_studio_teacher(studio_id)
  or (
    student_id = auth.uid()
    and public.is_studio_student(studio_id, auth.uid())
  )
);

grant select on public.lesson_notes to authenticated;
grant execute on function public.create_lesson_note(uuid, uuid, date, text, text, text, text, text) to authenticated;
grant execute on function public.update_lesson_note(uuid, uuid, date, text, text, text, text, text) to authenticated;
grant execute on function public.update_lesson_note_student_notes(uuid, text) to authenticated;
grant execute on function public.delete_lesson_note(uuid) to authenticated;
