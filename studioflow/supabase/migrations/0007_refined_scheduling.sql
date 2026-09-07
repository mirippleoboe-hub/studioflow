-- Refined scheduling: event types, recurring series, availability, and lesson requests.
alter table public.calendar_events
  add column if not exists event_type text not null default 'lesson'
    check (event_type in ('lesson','studio_event','unavailable')),
  add column if not exists recurrence_group_id uuid;

update public.calendar_events set event_type='studio_event' where student_id is null;

create table public.availability_rules (
 id uuid primary key default gen_random_uuid(),
 studio_id uuid not null references public.studios on delete cascade,
 teacher_id uuid not null references public.profiles on delete cascade,
 weekday smallint not null check (weekday between 0 and 6),
 start_minute smallint not null check (start_minute between 0 and 1439),
 end_minute smallint not null check (end_minute between 1 and 1440 and end_minute>start_minute),
 time_zone text not null,
 created_at timestamptz not null default now(),
 unique(studio_id,teacher_id,weekday,start_minute,end_minute)
);
alter table public.availability_rules enable row level security;
create policy "Studio sees teacher availability" on public.availability_rules for select to authenticated
 using(public.is_studio_member(studio_id));
create policy "Teachers manage availability" on public.availability_rules for all to authenticated
 using(teacher_id=auth.uid() and public.is_studio_teacher(studio_id))
 with check(teacher_id=auth.uid() and public.is_studio_teacher(studio_id));
grant select,insert,delete on public.availability_rules to authenticated;

create or replace function public.validate_availability_rule() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from pg_timezone_names where name=new.time_zone) then raise exception 'Invalid time zone'; end if;
 return new;
end $$;
create trigger validate_availability_rule before insert or update on public.availability_rules
 for each row execute function public.validate_availability_rule();

create table public.booking_requests (
 id uuid primary key default gen_random_uuid(),
 studio_id uuid not null references public.studios on delete cascade,
 teacher_id uuid not null references public.profiles on delete cascade,
 student_id uuid not null references public.profiles on delete cascade,
 requested_start timestamptz not null,
 requested_end timestamptz not null,
 time_zone text not null,
 note text not null default '' check(length(note)<=1000),
 status text not null default 'pending' check(status in ('pending','approved','declined','cancelled')),
 response_note text not null default '' check(length(response_note)<=1000),
 calendar_event_id uuid references public.calendar_events on delete set null,
 created_at timestamptz not null default now(),
 responded_at timestamptz,
 check(requested_end>requested_start and requested_end<=requested_start+interval '3 hours')
);
create index on public.booking_requests(studio_id,status,requested_start);
alter table public.booking_requests enable row level security;
create policy "Participants see lesson requests" on public.booking_requests for select to authenticated
 using((teacher_id=auth.uid() or student_id=auth.uid()) and public.is_studio_member(studio_id));
revoke all on public.booking_requests from anon,authenticated;
grant select on public.booking_requests to authenticated;

create or replace function public.request_lesson_slot(
 p_studio_id uuid,p_teacher_id uuid,p_requested_start timestamptz,p_requested_end timestamptz,p_time_zone text,p_note text default ''
) returns public.booking_requests language plpgsql security definer set search_path=public as $$
declare r public.booking_requests; local_start timestamp; local_end timestamp;
begin
 if auth.uid() is null or not public.is_studio_student(p_studio_id,auth.uid()) then raise exception 'Only active students can request lessons'; end if;
 if not public.is_studio_teacher(p_studio_id) and p_teacher_id=auth.uid() then raise exception 'Choose a studio teacher'; end if;
 if not exists(select 1 from studio_memberships where studio_id=p_studio_id and profile_id=p_teacher_id and role in ('owner','teacher')) then raise exception 'Choose a studio teacher'; end if;
 if p_requested_start<now() or p_requested_end<=p_requested_start or p_requested_end>p_requested_start+interval '3 hours' then raise exception 'Choose a future lesson time'; end if;
 if not exists(select 1 from pg_timezone_names where name=p_time_zone) then raise exception 'Invalid time zone'; end if;
 local_start:=p_requested_start at time zone p_time_zone; local_end:=p_requested_end at time zone p_time_zone;
 if local_start::date<>local_end::date or not exists(
   select 1 from availability_rules a where a.studio_id=p_studio_id and a.teacher_id=p_teacher_id
   and a.weekday=extract(dow from local_start)::int
   and a.start_minute<=extract(hour from local_start)::int*60+extract(minute from local_start)::int
   and a.end_minute>=extract(hour from local_end)::int*60+extract(minute from local_end)::int
 ) then raise exception 'This time is outside the teacher availability'; end if;
 perform pg_advisory_xact_lock(hashtext(p_studio_id::text));
 if exists(select 1 from calendar_events e where e.studio_id=p_studio_id and e.teacher_id=p_teacher_id and e.starts_at<p_requested_end and e.ends_at>p_requested_start)
 or exists(select 1 from booking_requests b where b.studio_id=p_studio_id and b.teacher_id=p_teacher_id and b.status='pending' and b.requested_start<p_requested_end and b.requested_end>p_requested_start)
 then raise exception 'This time is no longer available'; end if;
 insert into booking_requests(studio_id,teacher_id,student_id,requested_start,requested_end,time_zone,note)
 values(p_studio_id,p_teacher_id,auth.uid(),p_requested_start,p_requested_end,p_time_zone,left(trim(coalesce(p_note,'')),1000)) returning * into r;
 return r;
end $$;

create or replace function public.respond_booking_request(p_request_id uuid,p_decision text,p_response_note text default '')
 returns public.booking_requests language plpgsql security definer set search_path=public as $$
declare r public.booking_requests; event_id uuid;
begin
 if p_decision not in ('approved','declined') then raise exception 'Choose approve or decline'; end if;
 select * into r from booking_requests where id=p_request_id for update;
 if not found or r.teacher_id<>auth.uid() or not public.is_studio_teacher(r.studio_id) then raise exception 'Only the assigned teacher can respond'; end if;
 if r.status<>'pending' then raise exception 'This request has already been handled'; end if;
 if p_decision='approved' then
   insert into calendar_events(studio_id,teacher_id,student_id,title,description,starts_at,ends_at,time_zone,event_type)
   values(r.studio_id,r.teacher_id,r.student_id,'Lesson',r.note,r.requested_start,r.requested_end,r.time_zone,'lesson') returning id into event_id;
 end if;
 update booking_requests set status=p_decision,response_note=left(trim(coalesce(p_response_note,'')),1000),calendar_event_id=event_id,responded_at=now()
 where id=r.id returning * into r;
 return r;
end $$;

create or replace function public.cancel_booking_request(p_request_id uuid) returns public.booking_requests
 language plpgsql security definer set search_path=public as $$
declare r public.booking_requests;
begin
 update booking_requests set status='cancelled',responded_at=now() where id=p_request_id and student_id=auth.uid() and status='pending' returning * into r;
 if not found then raise exception 'Only your pending requests can be cancelled'; end if;
 return r;
end $$;

revoke all on function public.request_lesson_slot(uuid,uuid,timestamptz,timestamptz,text,text) from public;
revoke all on function public.respond_booking_request(uuid,text,text) from public;
revoke all on function public.cancel_booking_request(uuid) from public;
grant execute on function public.request_lesson_slot(uuid,uuid,timestamptz,timestamptz,text,text) to authenticated;
grant execute on function public.respond_booking_request(uuid,text,text) to authenticated;
grant execute on function public.cancel_booking_request(uuid) to authenticated;
