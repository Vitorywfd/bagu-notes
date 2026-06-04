create table if not exists public.public_questions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_question_id uuid,
  chapter_title text not null,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, source_question_id)
);

create index if not exists public_questions_created_idx on public.public_questions(created_at desc);
create index if not exists public_questions_owner_idx on public.public_questions(owner_id, created_at desc);

alter table public.public_questions enable row level security;

drop policy if exists "public_questions_select_all" on public.public_questions;
create policy "public_questions_select_all" on public.public_questions
for select to authenticated
using (true);

drop policy if exists "public_questions_insert_own" on public.public_questions;
create policy "public_questions_insert_own" on public.public_questions
for insert to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "public_questions_update_own" on public.public_questions;
create policy "public_questions_update_own" on public.public_questions
for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "public_questions_delete_own" on public.public_questions;
create policy "public_questions_delete_own" on public.public_questions
for delete to authenticated
using ((select auth.uid()) = owner_id);

grant select, insert, update, delete on public.public_questions to authenticated;
