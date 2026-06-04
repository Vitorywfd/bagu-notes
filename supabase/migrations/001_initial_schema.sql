create extension if not exists "pgcrypto";

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, title)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, chapter_id, question),
  foreign key (chapter_id, user_id) references public.chapters(id, user_id) on delete cascade
);

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id),
  foreign key (question_id, user_id) references public.questions(id, user_id) on delete cascade
);

create table if not exists public.study_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null,
  viewed_count integer not null default 0 check (viewed_count >= 0),
  last_viewed_at timestamptz not null default now(),
  primary key (user_id, question_id),
  foreign key (question_id, user_id) references public.questions(id, user_id) on delete cascade
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chapters_set_updated_at on public.chapters;
create trigger chapters_set_updated_at
before update on public.chapters
for each row execute function public.set_updated_at();

drop trigger if exists questions_set_updated_at on public.questions;
create trigger questions_set_updated_at
before update on public.questions
for each row execute function public.set_updated_at();

create index if not exists chapters_user_sort_idx on public.chapters(user_id, sort_order, created_at);
create index if not exists questions_user_chapter_sort_idx on public.questions(user_id, chapter_id, sort_order, created_at);
create index if not exists favorites_user_idx on public.favorites(user_id);
create index if not exists progress_user_idx on public.study_progress(user_id);

alter table public.chapters enable row level security;
alter table public.questions enable row level security;
alter table public.favorites enable row level security;
alter table public.study_progress enable row level security;

drop policy if exists "chapters_select_own" on public.chapters;
create policy "chapters_select_own" on public.chapters
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "chapters_insert_own" on public.chapters;
create policy "chapters_insert_own" on public.chapters
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "chapters_update_own" on public.chapters;
create policy "chapters_update_own" on public.chapters
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "chapters_delete_own" on public.chapters;
create policy "chapters_delete_own" on public.chapters
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "questions_select_own" on public.questions;
create policy "questions_select_own" on public.questions
for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "questions_insert_own" on public.questions;
create policy "questions_insert_own" on public.questions
for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "questions_update_own" on public.questions;
create policy "questions_update_own" on public.questions
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "questions_delete_own" on public.questions;
create policy "questions_delete_own" on public.questions
for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "favorites_all_own" on public.favorites;
create policy "favorites_all_own" on public.favorites
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "progress_all_own" on public.study_progress;
create policy "progress_all_own" on public.study_progress
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.chapters to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select, insert, update, delete on public.favorites to authenticated;
grant select, insert, update, delete on public.study_progress to authenticated;
