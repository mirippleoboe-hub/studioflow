create table if not exists public.studio_hub_pages (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null unique references public.studios(id) on delete cascade,
  title text not null default 'Studio Hub',
  blocks jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_hub_pages_blocks_array check (jsonb_typeof(blocks) = 'array')
);

create index if not exists studio_hub_pages_studio_id_idx on public.studio_hub_pages(studio_id);
create index if not exists studio_hub_pages_published_idx on public.studio_hub_pages(is_published);

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

drop trigger if exists set_studio_hub_pages_updated_at on public.studio_hub_pages;
create trigger set_studio_hub_pages_updated_at
  before update on public.studio_hub_pages
  for each row execute function public.set_updated_at();

create or replace function public.upsert_studio_hub_page(
  p_studio_id uuid,
  p_title text,
  p_blocks jsonb,
  p_is_published boolean
)
returns public.studio_hub_pages
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_page public.studio_hub_pages;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_studio_teacher(p_studio_id) then
    raise exception 'Only studio teachers can edit the studio hub';
  end if;

  if jsonb_typeof(coalesce(p_blocks, '[]'::jsonb)) <> 'array' then
    raise exception 'Studio hub blocks must be a JSON array';
  end if;

  insert into public.studio_hub_pages (
    studio_id,
    title,
    blocks,
    is_published,
    updated_by
  )
  values (
    p_studio_id,
    coalesce(nullif(trim(p_title), ''), 'Studio Hub'),
    coalesce(p_blocks, '[]'::jsonb),
    coalesce(p_is_published, false),
    auth.uid()
  )
  on conflict (studio_id) do update
  set
    title = excluded.title,
    blocks = excluded.blocks,
    is_published = excluded.is_published,
    updated_by = excluded.updated_by
  returning * into saved_page;

  return saved_page;
end;
$$;

alter table public.studio_hub_pages enable row level security;

drop policy if exists "Studio hub pages are readable by teachers and published studio members" on public.studio_hub_pages;
create policy "Studio hub pages are readable by teachers and published studio members"
on public.studio_hub_pages
for select
to authenticated
using (
  public.is_studio_teacher(studio_id)
  or (
    is_published = true
    and public.is_studio_member(studio_id)
  )
);

grant select on public.studio_hub_pages to authenticated;
grant execute on function public.upsert_studio_hub_page(uuid, text, jsonb, boolean) to authenticated;
